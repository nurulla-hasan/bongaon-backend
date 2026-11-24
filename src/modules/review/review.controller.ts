import type { Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import config from '../../config/index';
import { catchAsync } from '../../utils/catch-async';
import { jwtUtils } from '../../utils/jwt';
import { sendResponse } from '../../utils/send-response';
import { reviewService } from './review.service';
import type { GetReviewsQueryInput } from './review.validation';

const tryGetUserId = (req: Request): string | undefined => {
  const token =
    req.cookies?.accessToken ??
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.headers.authorization);

  if (!token) return undefined;

  try {
    const decoded = jwtUtils.verifyToken(token, config.jwt_access_secret);
    return typeof decoded.id === 'string' ? decoded.id : undefined;
  } catch {
    return undefined;
  }
};

const createReview: RequestHandler = catchAsync(async (req, res) => {
  const userId = tryGetUserId(req);
  const result = await reviewService.createReviewIntoDB(req.body, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Review submitted successfully',
    data: result,
  });
});

const getAllReviews: RequestHandler = catchAsync(async (req, res) => {
  const result = await reviewService.getAllReviewsFromDB(
    (req.validatedQuery ?? req.query) as GetReviewsQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Reviews retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const updateReview: RequestHandler = catchAsync(async (req, res) => {
  const result = await reviewService.updateReviewIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Review updated successfully',
    data: result,
  });
});

const deleteReview: RequestHandler = catchAsync(async (req, res) => {
  const result = await reviewService.deleteReviewFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  updateReview,
  deleteReview,
};
