export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  maxLimit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Normalizes pagination options with safe bounds and calculates Prisma `skip`.
 */
export const calculatePagination = (options: PaginationOptions = {}): PaginationParams => {
  const maxLimit = options.maxLimit ?? MAX_LIMIT;
  const page = Math.max(1, Math.floor(Number(options.page) || DEFAULT_PAGE));
  const limit = Math.min(maxLimit, Math.max(1, Math.floor(Number(options.limit) || DEFAULT_LIMIT)));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Builds standardized pagination metadata from normalized page, limit, and total count.
 */
export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
