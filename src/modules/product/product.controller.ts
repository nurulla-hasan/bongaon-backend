import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { productService } from './product.service';
import type { GetProductsQueryInput } from './product.validation';

const createProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.createProductIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Product created successfully',
    data: result,
  });
});

const getAllProducts: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.getAllProductsFromDB(
    (req.validatedQuery ?? req.query) as GetProductsQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Products retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getProductByIdOrSlug: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.getProductByIdOrSlugFromDB(req.params.idOrSlug as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product retrieved successfully',
    data: result,
  });
});

const updateProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.updateProductIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product updated successfully',
    data: result,
  });
});

const uploadProductImage: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.uploadProductImageIntoDB(req.params.id as string, req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product image updated successfully',
    data: result,
  });
});

const uploadProductGallery: RequestHandler = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await productService.uploadProductGalleryIntoDB(req.params.id as string, files);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Product gallery updated successfully',
    data: result,
  });
});

const removeProductGalleryImage: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.removeProductGalleryImageFromDB(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Gallery image removed successfully',
    data: result,
  });
});

const deleteProduct: RequestHandler = catchAsync(async (req, res) => {
  const result = await productService.deleteProductFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const productController = {
  createProduct,
  getAllProducts,
  getProductByIdOrSlug,
  updateProduct,
  uploadProductImage,
  uploadProductGallery,
  removeProductGalleryImage,
  deleteProduct,
};
