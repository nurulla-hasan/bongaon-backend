import httpStatus from 'http-status';
import type { Prisma } from '../../../generated/prisma/client';
import { deleteFromCloudinary, uploadToCloudinary } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { buildPaginationMeta, calculatePagination } from '../../utils/pagination';
import type {
  CreateCategoryInput,
  GetCategoriesQueryInput,
  UpdateCategoryInput,
} from './category.validation';

const generateSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const CATEGORY_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  subtitle: true,
  iconName: true,
  imageUrl: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

const CATEGORY_ORDER_BY_MAP: Record<string, Prisma.CategoryOrderByWithRelationInput[]> = {
  sort_order: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  newest: [{ createdAt: 'desc' }],
  oldest: [{ createdAt: 'asc' }],
  name_asc: [{ name: 'asc' }],
  name_desc: [{ name: 'desc' }],
};

const createCategoryIntoDB = async (payload: CreateCategoryInput) => {
  const slug = payload.slug || generateSlug(payload.name);

  if (!slug) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Could not generate a valid slug from name');
  }

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: { equals: payload.name, mode: 'insensitive' } }, { slug }],
    },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A category with this name or slug already exists',
      'DUPLICATE_CATEGORY',
    );
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
      slug,
      subtitle: payload.subtitle ?? '',
      iconName: payload.iconName ?? 'package',
      sortOrder: payload.sortOrder ?? 0,
      isActive: payload.isActive ?? true,
    },
    select: CATEGORY_PUBLIC_SELECT,
  });

  return category;
};

const getAllCategoriesFromDB = async (query: GetCategoriesQueryInput) => {
  const { page, limit, searchTerm, isActive, sortBy } = query;
  const { page: pageNum, limit: limitNum, skip } = calculatePagination({ page, limit });

  const andConditions: Prisma.CategoryWhereInput[] = [];

  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { slug: { contains: term, mode: 'insensitive' } },
        { subtitle: { contains: term, mode: 'insensitive' } },
      ],
    });
  }

  if (typeof isActive === 'boolean') {
    andConditions.push({ isActive });
  }

  const whereCondition: Prisma.CategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy = CATEGORY_ORDER_BY_MAP[sortBy] || CATEGORY_ORDER_BY_MAP.sort_order;

  const [total, categories] = await Promise.all([
    prisma.category.count({ where: whereCondition }),
    prisma.category.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: CATEGORY_PUBLIC_SELECT,
    }),
  ]);

  return {
    meta: buildPaginationMeta(pageNum, limitNum, total),
    data: categories,
  };
};

const getCategoryByIdOrSlugFromDB = async (idOrSlug: string) => {
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    select: CATEGORY_PUBLIC_SELECT,
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  return category;
};

const updateCategoryIntoDB = async (id: string, payload: UpdateCategoryInput) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const nextSlug =
    payload.slug ?? (payload.name && !payload.slug ? generateSlug(payload.name) : undefined);

  if (payload.name || nextSlug) {
    const duplicateConditions: Prisma.CategoryWhereInput[] = [];
    if (payload.name) {
      duplicateConditions.push({ name: { equals: payload.name, mode: 'insensitive' } });
    }
    if (nextSlug) {
      duplicateConditions.push({ slug: nextSlug });
    }

    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: id },
        OR: duplicateConditions,
      },
    });

    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        'Another category with this name or slug already exists',
        'DUPLICATE_CATEGORY',
      );
    }
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(nextSlug !== undefined && { slug: nextSlug }),
      ...(payload.subtitle !== undefined && { subtitle: payload.subtitle }),
      ...(payload.iconName !== undefined && { iconName: payload.iconName }),
      ...(payload.sortOrder !== undefined && { sortOrder: payload.sortOrder }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
    select: CATEGORY_PUBLIC_SELECT,
  });

  return updatedCategory;
};

const uploadCategoryImageIntoDB = async (id: string, file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image file');
  }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (category.imagePublicId) {
    await deleteFromCloudinary(category.imagePublicId);
  }

  const result = await uploadToCloudinary(file.buffer, 'bongaon-bajar/categories');

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    },
    select: CATEGORY_PUBLIC_SELECT,
  });

  return updatedCategory;
};

const deleteCategoryFromDB = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true, imagePublicId: true },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (category.imagePublicId) {
    await deleteFromCloudinary(category.imagePublicId);
  }

  await prisma.category.delete({ where: { id } });

  return { message: 'Category deleted successfully' };
};

export const categoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getCategoryByIdOrSlugFromDB,
  updateCategoryIntoDB,
  uploadCategoryImageIntoDB,
  deleteCategoryFromDB,
};
