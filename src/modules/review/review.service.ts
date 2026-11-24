import httpStatus from 'http-status';
import type { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildPaginationMeta, calculatePagination } from '../../utils/pagination';
import type {
  CreateReviewInput,
  GetReviewsQueryInput,
  UpdateReviewInput,
} from './review.validation';

const REVIEW_PUBLIC_SELECT = {
  id: true,
  productId: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  userId: true,
  customerName: true,
  location: true,
  rating: true,
  comment: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ReviewSelect;

const REVIEW_SORT_MAP: Record<string, Prisma.ReviewOrderByWithRelationInput[]> = {
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  rating_desc: [{ rating: 'desc' }, { createdAt: 'desc' }],
  rating_asc: [{ rating: 'asc' }, { createdAt: 'desc' }],
};

const syncProductRatingStats = async (
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> => {
  const stats = await tx.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { id: true },
  });

  const avgRating = stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;

  await tx.product.update({
    where: { id: productId },
    data: {
      rating: avgRating,
      reviewCount: stats._count.id,
    },
  });
};

const createReviewIntoDB = async (payload: CreateReviewInput, userId?: string) => {
  const product = await prisma.product.findFirst({
    where: { id: payload.productId, isActive: true },
    select: { id: true },
  });

  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, 'Product not found or inactive');
  }

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        productId: payload.productId,
        ...(userId && { userId }),
        customerName: payload.customerName,
        location: payload.location ?? '',
        rating: payload.rating,
        comment: payload.comment,
        isApproved: true,
      },
      select: REVIEW_PUBLIC_SELECT,
    });

    await syncProductRatingStats(tx, payload.productId);
    return created;
  });

  return review;
};

const getAllReviewsFromDB = async (query: GetReviewsQueryInput) => {
  const { page, limit, searchTerm, productId, productSlug, rating, isApproved, sortBy } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { customerName: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { comment: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (productId) {
    andConditions.push({ productId });
  }

  if (productSlug?.trim()) {
    andConditions.push({ product: { slug: productSlug.trim() } });
  }

  if (rating !== undefined) {
    andConditions.push({ rating });
  }

  if (typeof isApproved === 'boolean') {
    andConditions.push({ isApproved });
  }

  const whereCondition: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = REVIEW_SORT_MAP[sortBy] || REVIEW_SORT_MAP.newest;

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: whereCondition }),
    prisma.review.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: REVIEW_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: reviews,
  };
};

const updateReviewIntoDB = async (id: string, payload: UpdateReviewInput) => {
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { id: true, productId: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id },
      data: {
        ...(payload.isApproved !== undefined && { isApproved: payload.isApproved }),
        ...(payload.rating !== undefined && { rating: payload.rating }),
        ...(payload.comment !== undefined && { comment: payload.comment }),
      },
      select: REVIEW_PUBLIC_SELECT,
    });

    await syncProductRatingStats(tx, existing.productId);
    return review;
  });

  return updated;
};

const deleteReviewFromDB = async (id: string) => {
  const existing = await prisma.review.findUnique({
    where: { id },
    select: { id: true, productId: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Review not found');
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await syncProductRatingStats(tx, existing.productId);
  });

  return { message: 'Review deleted successfully' };
};

export const reviewService = {
  createReviewIntoDB,
  getAllReviewsFromDB,
  updateReviewIntoDB,
  deleteReviewFromDB,
};
