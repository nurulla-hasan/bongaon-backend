import type { OrderStatus } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';

const ORDER_STATUSES: readonly OrderStatus[] = [
  'PENDING',
  'PROCESSING',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
];

const buildLastSixMonthBuckets = (now: Date) => {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const buckets: Array<{ key: string; month: string; revenue: number; orders: number }> = [];
  const bucketMap = new Map<string, { month: string; revenue: number; orders: number }>();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const entry = {
      month: formatter.format(date),
      revenue: 0,
      orders: 0,
    };
    buckets.push({ key, ...entry });
    bucketMap.set(key, entry);
  }

  return { buckets, bucketMap };
};

const getDashboardOverviewFromDB = async () => {
  const now = new Date();
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    orderGroups,
    categories,
    activeProducts,
    lowStockProducts,
    totalUsers,
    unreadContacts,
    pendingApprovalReviews,
    deliveredLastSixMonths,
    recentOrders,
  ] = await Promise.all([
    prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.category.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stock: { lte: 5 } } }),
    prisma.user.count(),
    prisma.contactMessage.count({ where: { status: 'NEW' } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: sixMonthsStart },
        status: 'DELIVERED',
      },
      select: {
        total: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        orderNumber: true,
        receiverName: true,
        district: true,
        total: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const countsByStatus: Record<OrderStatus, number> = {
    PENDING: 0,
    PROCESSING: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  const sumsByStatus: Record<OrderStatus, number> = {
    PENDING: 0,
    PROCESSING: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  for (const group of orderGroups) {
    countsByStatus[group.status] = group._count.id;
    sumsByStatus[group.status] = group._sum.total ?? 0;
  }

  const totalOrders = ORDER_STATUSES.reduce((acc, status) => acc + countsByStatus[status], 0);
  const totalRevenue = sumsByStatus.DELIVERED;
  const activeOrderValue =
    sumsByStatus.PENDING + sumsByStatus.PROCESSING + sumsByStatus.IN_TRANSIT;

  const { buckets, bucketMap } = buildLastSixMonthBuckets(now);

  for (const order of deliveredLastSixMonths) {
    const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
    const target = bucketMap.get(key);
    if (target) {
      target.revenue += order.total;
      target.orders += 1;
    }
  }

  const monthlyRevenue = buckets.map(({ key }) => bucketMap.get(key)!);

  return {
    orders: {
      total: totalOrders,
      pending: countsByStatus.PENDING,
      processing: countsByStatus.PROCESSING,
      inTransit: countsByStatus.IN_TRANSIT,
      delivered: countsByStatus.DELIVERED,
      cancelled: countsByStatus.CANCELLED,
      totalRevenue,
      activeOrderValue,
    },
    catalog: {
      categories,
      activeProducts,
      lowStockProducts,
    },
    users: {
      total: totalUsers,
    },
    contacts: {
      unread: unreadContacts,
    },
    reviews: {
      pendingApproval: pendingApprovalReviews,
    },
    monthlyRevenue,
    recentOrders,
  };
};

export const dashboardService = {
  getDashboardOverviewFromDB,
};
