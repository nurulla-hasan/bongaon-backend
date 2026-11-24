import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { categoryService } from './category.service';
import type { GetCategoriesQueryInput } from './category.validation';

const createCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.createCategoryIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

const getAllCategories: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.getAllCategoriesFromDB(
    (req.validatedQuery ?? req.query) as GetCategoriesQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getCategoryByIdOrSlug: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.getCategoryByIdOrSlugFromDB(req.params.idOrSlug as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category retrieved successfully',
    data: result,
  });
});

const updateCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.updateCategoryIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category updated successfully',
    data: result,
  });
});

const uploadCategoryImage: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.uploadCategoryImageIntoDB(req.params.id as string, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Category image updated successfully',
    data: result,
  });
});

const deleteCategory: RequestHandler = catchAsync(async (req, res) => {
  const result = await categoryService.deleteCategoryFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryByIdOrSlug,
  updateCategory,
  uploadCategoryImage,
  deleteCategory,
};
