import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { validate, validateQuery } from '../../middlewares/validate';
import { categoryController } from './category.controller';
import {
  createCategorySchema,
  getCategoriesQuerySchema,
  updateCategorySchema,
} from './category.validation';

export const categoryRouter = Router();

// Get all categories (Public)
categoryRouter.get(
  '/',
  validateQuery(getCategoriesQuerySchema),
  categoryController.getAllCategories,
);

// Get category by ID or slug (Public)
categoryRouter.get('/:idOrSlug', categoryController.getCategoryByIdOrSlug);

// Create new category (Admin)
categoryRouter.post(
  '/',
  auth('ADMIN'),
  validate(createCategorySchema),
  categoryController.createCategory,
);

// Update category (Admin)
categoryRouter.patch(
  '/:id',
  auth('ADMIN'),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

// Upload category image (Admin)
categoryRouter.patch(
  '/:id/image',
  auth('ADMIN'),
  upload.single('image'),
  categoryController.uploadCategoryImage,
);

// Delete category (Admin)
categoryRouter.delete('/:id', auth('ADMIN'), categoryController.deleteCategory);
