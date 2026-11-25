import httpStatus from 'http-status';
import type { Prisma } from '../../../generated/prisma/client';
import { deleteFromCloudinary, uploadToCloudinary } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildPaginationMeta, calculatePagination } from '../../utils/pagination';
import type {
  CreateProductInput,
  GetProductsQueryInput,
  RemoveGalleryImageInput,
  UpdateProductInput,
} from './product.validation';

interface GalleryImage {
  url: string;
  publicId: string;
}

const generateSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const PRODUCT_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortTag: true,
  badge: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  price: true,
  originalPrice: true,
  unit: true,
  stock: true,
  imageUrl: true,
  gallery: true,
  deliveryDays: true,
  shelfLife: true,
  origin: true,
  description: true,
  highlights: true,
  ingredients: true,
  packOptions: true,
  rating: true,
  reviewCount: true,
  isFeatured: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

const PRODUCT_ORDER_BY_MAP: Record<string, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ reviewCount: 'desc' }, { rating: 'desc' }],
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  price_asc: [{ price: 'asc' }],
  price_desc: [{ price: 'desc' }],
  rating_desc: [{ rating: 'desc' }, { reviewCount: 'desc' }],
  name_asc: [{ name: 'asc' }],
};

const assertCategoryExists = async (categoryId: string): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }
};

const parseGallery = (raw: unknown): GalleryImage[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is GalleryImage =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as GalleryImage).url === 'string' &&
      typeof (item as GalleryImage).publicId === 'string',
  );
};

const createProductIntoDB = async (payload: CreateProductInput) => {
  await assertCategoryExists(payload.categoryId);

  const slug = payload.slug || generateSlug(payload.name);
  if (!slug) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Could not generate a valid slug from name');
  }

  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A product with this slug already exists',
      'DUPLICATE_PRODUCT',
    );
  }

  const product = await prisma.product.create({
    data: {
      name: payload.name,
      slug,
      shortTag: payload.shortTag ?? '',
      badge: payload.badge ?? null,
      categoryId: payload.categoryId,
      price: payload.price,
      originalPrice: payload.originalPrice ?? null,
      unit: payload.unit ?? '250g',
      stock: payload.stock ?? 0,
      deliveryDays: payload.deliveryDays ?? '4-7 Days',
      shelfLife: payload.shelfLife ?? '',
      origin: payload.origin ?? '',
      description: payload.description,
      highlights: payload.highlights ?? [],
      ingredients: payload.ingredients ?? [],
      packOptions: (payload.packOptions ?? []) as Prisma.InputJsonValue,
      isFeatured: payload.isFeatured ?? false,
      isActive: payload.isActive ?? true,
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  return product;
};

const getAllProductsFromDB = async (query: GetProductsQueryInput) => {
  const {
    page,
    limit,
    searchTerm,
    categoryId,
    categorySlug,
    minPrice,
    maxPrice,
    minRating,
    onlyDiscounted,
    isFeatured,
    isActive,
    sortBy,
  } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const andConditions: Prisma.ProductWhereInput[] = [];

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
        { shortTag: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (categoryId) {
    andConditions.push({ categoryId });
  }

  if (categorySlug?.trim()) {
    andConditions.push({ category: { slug: categorySlug.trim() } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    andConditions.push({
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    });
  }

  if (minRating !== undefined && minRating > 0) {
    andConditions.push({ rating: { gte: minRating } });
  }

  if (onlyDiscounted) {
    andConditions.push({ originalPrice: { not: null } });
  }

  if (typeof isFeatured === 'boolean') {
    andConditions.push({ isFeatured });
  }

  if (typeof isActive === 'boolean') {
    andConditions.push({ isActive });
  }

  const whereCondition: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = PRODUCT_ORDER_BY_MAP[sortBy] || PRODUCT_ORDER_BY_MAP.newest;

  const [total, products] = await Promise.all([
    prisma.product.count({ where: whereCondition }),
    prisma.product.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: PRODUCT_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: products,
  };
};

const getProductByIdOrSlugFromDB = async (idOrSlug: string) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  return product;
};

const updateProductIntoDB = async (id: string, payload: UpdateProductInput) => {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (payload.categoryId) {
    await assertCategoryExists(payload.categoryId);
  }

  const nextSlug =
    payload.slug ?? (payload.name && !payload.slug ? generateSlug(payload.name) : undefined);

  if (nextSlug) {
    const duplicate = await prisma.product.findFirst({
      where: {
        id: { not: id },
        slug: nextSlug,
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Another product with this slug already exists',
        'DUPLICATE_PRODUCT',
      );
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(nextSlug !== undefined && { slug: nextSlug }),
      ...(payload.shortTag !== undefined && { shortTag: payload.shortTag }),
      ...(payload.badge !== undefined && { badge: payload.badge }),
      ...(payload.categoryId !== undefined && { categoryId: payload.categoryId }),
      ...(payload.price !== undefined && { price: payload.price }),
      ...(payload.originalPrice !== undefined && { originalPrice: payload.originalPrice }),
      ...(payload.unit !== undefined && { unit: payload.unit }),
      ...(payload.stock !== undefined && { stock: payload.stock }),
      ...(payload.deliveryDays !== undefined && { deliveryDays: payload.deliveryDays }),
      ...(payload.shelfLife !== undefined && { shelfLife: payload.shelfLife }),
      ...(payload.origin !== undefined && { origin: payload.origin }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.highlights !== undefined && { highlights: payload.highlights }),
      ...(payload.ingredients !== undefined && { ingredients: payload.ingredients }),
      ...(payload.packOptions !== undefined && {
        packOptions: payload.packOptions as Prisma.InputJsonValue,
      }),
      ...(payload.isFeatured !== undefined && { isFeatured: payload.isFeatured }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  return updatedProduct;
};

const uploadProductImageIntoDB = async (id: string, file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image file');
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (product.imagePublicId) {
    await deleteFromCloudinary(product.imagePublicId);
  }

  const result = await uploadToCloudinary(file.buffer, 'bongaon-bajar/products');

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  return updatedProduct;
};

const uploadProductGalleryIntoDB = async (id: string, files?: Express.Multer.File[]) => {
  if (!files || files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload at least one gallery image');
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, gallery: true },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const uploaded = await Promise.all(
    files.map((file) => uploadToCloudinary(file.buffer, 'bongaon-bajar/products/gallery')),
  );

  const existingGallery = parseGallery(product.gallery);
  const nextGallery: GalleryImage[] = [
    ...existingGallery,
    ...uploaded.map((item) => ({ url: item.secure_url, publicId: item.public_id })),
  ];

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      gallery: nextGallery as unknown as Prisma.InputJsonValue,
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  return updatedProduct;
};

const removeProductGalleryImageFromDB = async (id: string, payload: RemoveGalleryImageInput) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, gallery: true },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const existingGallery = parseGallery(product.gallery);
  const target = existingGallery.find((item) => item.publicId === payload.publicId);

  if (!target) {
    throw new AppError(httpStatus.NOT_FOUND, 'Gallery image not found on this product');
  }

  await deleteFromCloudinary(target.publicId);

  const nextGallery = existingGallery.filter((item) => item.publicId !== payload.publicId);

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      gallery: nextGallery as unknown as Prisma.InputJsonValue,
    },
    select: PRODUCT_PUBLIC_SELECT,
  });

  return updatedProduct;
};

const deleteProductFromDB = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true, gallery: true },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found');
  }

  const gallery = parseGallery(product.gallery);
  const publicIds = [
    ...(product.imagePublicId ? [product.imagePublicId] : []),
    ...gallery.map((item) => item.publicId),
  ];

  if (publicIds.length > 0) {
    await Promise.all(publicIds.map((publicId) => deleteFromCloudinary(publicId)));
  }

  await prisma.product.delete({ where: { id } });

  return { message: 'Product deleted successfully' };
};

const getHomeSectionsFromDB = async () => {
  const [categories, featuredProducts, showcaseCategories] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        imageUrl: true,
        sortOrder: true,
        isActive: true,
        showOnHome: true,
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
      select: PRODUCT_PUBLIC_SELECT,
    }),
    prisma.category.findMany({
      where: { isActive: true, showOnHome: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        subtitle: true,
        imageUrl: true,
        products: {
          where: { isActive: true },
          orderBy: [{ createdAt: 'desc' }],
          take: 10,
          select: PRODUCT_PUBLIC_SELECT,
        },
      },
    }),
  ]);

  const showcases = showcaseCategories
    .filter((category) => category.products.length > 0)
    .map(({ products, ...category }) => ({
      category,
      products,
    }));

  return {
    categories,
    featuredProducts,
    showcases,
  };
};

export const productService = {
  createProductIntoDB,
  getAllProductsFromDB,
  getProductByIdOrSlugFromDB,
  getHomeSectionsFromDB,
  updateProductIntoDB,
  uploadProductImageIntoDB,
  uploadProductGalleryIntoDB,
  removeProductGalleryImageFromDB,
  deleteProductFromDB,
};
