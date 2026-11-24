import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate, validateQuery } from '../../middlewares/validate';
import { reviewController } from './review.controller';
import { createReviewSchema, getReviewsQuerySchema, updateReviewSchema } from './review.validation';

export const reviewRouter = Router();

// Get all reviews (Public)
reviewRouter.get('/', validateQuery(getReviewsQuerySchema), reviewController.getAllReviews);

// Submit a review (Public - works for guests and logged-in users)
reviewRouter.post('/', validate(createReviewSchema), reviewController.createReview);

// Update/approve/hide review (Admin)
reviewRouter.patch(
  '/:id',
  auth('ADMIN'),
  validate(updateReviewSchema),
  reviewController.updateReview,
);

// Delete review (Admin)
reviewRouter.delete('/:id', auth('ADMIN'), reviewController.deleteReview);
