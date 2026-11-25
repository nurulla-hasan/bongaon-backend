import { randomInt } from 'node:crypto';
import httpStatus from 'http-status';
import type { OrderStatus, Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildPaginationMeta, calculatePagination } from '../../utils/pagination';
import { DEFAULT_DELIVERY_CHARGE_BDT, ORDER_PAYMENT_METHOD } from './order.constants';
import type {
  CreateOrderInput,
  GetMyOrdersQueryInput,
  GetOrdersQueryInput,
  TrackOrderQueryInput,
  UpdateOrderStatusInput,
} from './order.validation';

interface PackOption {
  label: string;
  price: number;
  originalPrice?: number;
}

const ORDER_PUBLIC_SELECT = {
  id: true,
  orderNumber: true,
  userId: true,
  receiverName: true,
  receiverPhone: true,
  district: true,
  fullAddress: true,
  whatsappNumber: true,
  orderNote: true,
  subtotal: true,
  deliveryCharge: true,
  total: true,
  paymentMethod: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      productSlug: true,
      productImage: true,
      selectedPack: true,
      quantity: true,
      unitPrice: true,
      lineTotal: true,
    },
  },
} satisfies Prisma.OrderSelect;

const ORDER_SORT_MAP: Record<string, Prisma.OrderOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  total_asc: [{ total: 'asc' }],
  total_desc: [{ total: 'desc' }],
};

const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const suffix = randomInt(100000, 1000000);
  return `BB-${year}-${suffix}`;
};

const normalizePhone = (phone: string): string => phone.replace(/[\s-]/g, '').trim();

const parsePackOptions = (raw: unknown): PackOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is PackOption =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as PackOption).label === 'string' &&
      typeof (item as PackOption).price === 'number',
  );
};

const resolveItemUnitPrice = (
  product: { name: string; price: number; unit: string; packOptions: unknown },
  selectedPack: string,
): number => {
  const options = parsePackOptions(product.packOptions);
  if (options.length > 0) {
    const matched = options.find((opt) => opt.label.toLowerCase() === selectedPack.toLowerCase());
    if (!matched) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid pack option '${selectedPack}' for product '${product.name}'`,
        'INVALID_PACK_OPTION',
      );
    }
    return matched.price;
  }

  if (product.unit.toLowerCase() !== selectedPack.toLowerCase()) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid pack option '${selectedPack}' for product '${product.name}'`,
      'INVALID_PACK_OPTION',
    );
  }

  return product.price;
};

const createOrderIntoDB = async (payload: CreateOrderInput, userId?: string) => {
  const productIds = [...new Set(payload.items.map((item) => item.productId))];

  // Aggregate requested quantities per productId in case the same product appears with multiple packs
  const quantityByProduct = new Map<string, number>();
  for (const item of payload.items) {
    quantityByProduct.set(
      item.productId,
      (quantityByProduct.get(item.productId) ?? 0) + item.quantity,
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        price: true,
        unit: true,
        stock: true,
        packOptions: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const [productId, totalQty] of quantityByProduct.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          `Product '${productId}' was not found or is inactive`,
        );
      }

      const updated = await tx.product.updateMany({
        where: { id: productId, stock: { gte: totalQty } },
        data: { stock: { decrement: totalQty } },
      });

      if (updated.count === 0) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Insufficient stock for '${product.name}' (available: ${product.stock})`,
          'INSUFFICIENT_STOCK',
        );
      }
    }

    let subtotal = 0;
    const orderItemsData: Prisma.OrderItemCreateWithoutOrderInput[] = payload.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
      }

      const unitPrice = resolveItemUnitPrice(product, item.selectedPack);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      return {
        product: { connect: { id: product.id } },
        productName: product.name,
        productSlug: product.slug,
        productImage: product.imageUrl,
        selectedPack: item.selectedPack,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const storeSetting = await tx.storeSetting.findUnique({
      where: { id: 'default' },
      select: {
        defaultDeliveryCharge: true,
        freeDeliveryMinOrder: true,
        isOrderingEnabled: true,
      },
    });

    if (storeSetting && !storeSetting.isOrderingEnabled) {
      throw new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Orders are temporarily paused. Please try again later.',
      );
    }

    const baseDeliveryCharge =
      storeSetting?.defaultDeliveryCharge ?? DEFAULT_DELIVERY_CHARGE_BDT;
    const isFreeDelivery =
      Boolean(storeSetting && storeSetting.freeDeliveryMinOrder > 0) &&
      subtotal >= (storeSetting?.freeDeliveryMinOrder ?? 0);
    const deliveryCharge = isFreeDelivery ? 0 : baseDeliveryCharge;
    const total = subtotal + deliveryCharge;

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        ...(userId && { userId }),
        receiverName: payload.receiverName,
        receiverPhone: payload.receiverPhone,
        district: payload.district,
        fullAddress: payload.fullAddress,
        whatsappNumber: payload.whatsappNumber ?? '',
        orderNote: payload.orderNote ?? '',
        subtotal,
        deliveryCharge,
        total,
        paymentMethod: ORDER_PAYMENT_METHOD,
        status: 'PENDING',
        items: {
          create: orderItemsData,
        },
      },
      select: ORDER_PUBLIC_SELECT,
    });
  });

  return order;
};

const trackOrderFromDB = async (orderNumber: string, query: TrackOrderQueryInput) => {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
    select: ORDER_PUBLIC_SELECT,
  });

  if (!order || normalizePhone(order.receiverPhone) !== normalizePhone(query.phone)) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found with this order number and phone');
  }

  return order;
};

const getMyOrdersFromDB = async (userId: string, query: GetMyOrdersQueryInput) => {
  const { page, limit, status } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const whereCondition: Prisma.OrderWhereInput = {
    userId,
    ...(status && { status: status as OrderStatus }),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: whereCondition }),
    prisma.order.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy: [{ createdAt: 'desc' }],
      select: ORDER_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: orders,
  };
};

const getAllOrdersFromDB = async (query: GetOrdersQueryInput) => {
  const { page, limit, searchTerm, status, district, sortBy } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const andConditions: Prisma.OrderWhereInput[] = [];

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { receiverName: { contains: term, mode: 'insensitive' } },
        { receiverPhone: { contains: term, mode: 'insensitive' } },
        { district: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status: status as OrderStatus });
  }

  if (district?.trim()) {
    andConditions.push({ district: { contains: district.trim(), mode: 'insensitive' } });
  }

  const whereCondition: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = ORDER_SORT_MAP[sortBy] || ORDER_SORT_MAP.newest;

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: whereCondition }),
    prisma.order.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: ORDER_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: orders,
  };
};

const getOrderByIdFromDB = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    select: ORDER_PUBLIC_SELECT,
  });

  if (!order) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return order;
};

const updateOrderStatusIntoDB = async (id: string, payload: UpdateOrderStatusInput) => {
  const existing = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      items: {
        select: {
          productId: true,
          quantity: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (existing.status === 'CANCELLED' && payload.status !== 'CANCELLED') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'A cancelled order cannot be reopened',
      'INVALID_STATUS_TRANSITION',
    );
  }

  if (existing.status === payload.status) {
    return getOrderByIdFromDB(id);
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    if (payload.status === 'CANCELLED') {
      for (const item of existing.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id },
      data: { status: payload.status as OrderStatus },
      select: ORDER_PUBLIC_SELECT,
    });
  });

  return updatedOrder;
};

export const orderService = {
  createOrderIntoDB,
  trackOrderFromDB,
  getMyOrdersFromDB,
  getAllOrdersFromDB,
  getOrderByIdFromDB,
  updateOrderStatusIntoDB,
};
