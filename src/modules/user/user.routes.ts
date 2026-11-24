import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { userController } from './user.controller';
import { createAdminSchema, updateUserRoleSchema, updateUserStatusSchema } from './user.validation';

export const userRouter = Router();

// Upload current user profile image
userRouter.patch(
  '/profile-image',
  auth(),
  upload.single('image'),
  userController.uploadProfileImage,
);

// Get all users (Admin)
userRouter.get('/', auth('ADMIN'), userController.getAllUsers);

// Get system dashboard stats (Admin)
userRouter.get('/admin/dashboard-stats', auth('ADMIN'), userController.getDashboardStats);

// Get user by ID (Admin)
userRouter.get('/:id', auth('ADMIN'), userController.getUserById);

// Create new Admin (Admin)
userRouter.post(
  '/create-admin',
  auth('ADMIN'),
  validate(createAdminSchema),
  userController.createAdmin,
);

// Update user status (Admin)
userRouter.patch(
  '/:id/status',
  auth('ADMIN'),
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

// Update user role (Admin)
userRouter.patch(
  '/:id/role',
  auth('ADMIN'),
  validate(updateUserRoleSchema),
  userController.updateUserRole,
);

// Delete user (Admin)
userRouter.delete('/:id', auth('ADMIN'), userController.deleteUser);
