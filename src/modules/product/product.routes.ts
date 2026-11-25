import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { validate, validateQuery } from '../../middlewares/validate';
import { productController } from './product.controller';
import {
  createProductSchema,
  getProductsQuerySchema,
  removeGalleryImageSchema,
  updateProductSchema,
} from './product.validation';

export const productRouter = Router();

// Get home page sections: categories, featured products, and showcase categories (Public)
productRouter.get('/home', productController.getHomeSections);

// Get all products (Public)
productRouter.get('/', validateQuery(getProductsQuerySchema), productController.getAllProducts);

// Get product by ID or slug (Public)
productRouter.get('/:idOrSlug', productController.getProductByIdOrSlug);

// Create new product (Admin)
productRouter.post(
  '/',
  auth('ADMIN'),
  validate(createProductSchema),
  productController.createProduct,
);

// Update product (Admin)
productRouter.patch(
  '/:id',
  auth('ADMIN'),
  validate(updateProductSchema),
  productController.updateProduct,
);

// Upload main product image (Admin)
productRouter.patch(
  '/:id/image',
  auth('ADMIN'),
  upload.single('image'),
  productController.uploadProductImage,
);

// Upload product gallery images (Admin)
productRouter.patch(
  '/:id/gallery',
  auth('ADMIN'),
  upload.array('images', 5),
  productController.uploadProductGallery,
);

// Remove a product gallery image (Admin)
productRouter.delete(
  '/:id/gallery',
  auth('ADMIN'),
  validate(removeGalleryImageSchema),
  productController.removeProductGalleryImage,
);

// Delete product (Admin)
productRouter.delete('/:id', auth('ADMIN'), productController.deleteProduct);
