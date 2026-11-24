import type { Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import config from '../../config/index';
import { catchAsync } from '../../utils/catch-async';
import { jwtUtils } from '../../utils/jwt';
import { sendResponse } from '../../utils/send-response';
import { orderService } from './order.service';
import type {
  GetMyOrdersQueryInput,
  GetOrdersQueryInput,
  TrackOrderQueryInput,
} from './order.validation';

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

const createOrder: RequestHandler = catchAsync(async (req, res) => {
  const userId = tryGetUserId(req);
  const result = await orderService.createOrderIntoDB(req.body, userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Order placed successfully',
    data: result,
  });
});

const trackOrder: RequestHandler = catchAsync(async (req, res) => {
  const result = await orderService.trackOrderFromDB(
    req.params.orderNumber as string,
    (req.validatedQuery ?? req.query) as TrackOrderQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const getMyOrders: RequestHandler = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await orderService.getMyOrdersFromDB(
    userId,
    (req.validatedQuery ?? req.query) as GetMyOrdersQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getAllOrders: RequestHandler = catchAsync(async (req, res) => {
  const result = await orderService.getAllOrdersFromDB(
    (req.validatedQuery ?? req.query) as GetOrdersQueryInput,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Orders retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getOrderById: RequestHandler = catchAsync(async (req, res) => {
  const result = await orderService.getOrderByIdFromDB(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order retrieved successfully',
    data: result,
  });
});

const updateOrderStatus: RequestHandler = catchAsync(async (req, res) => {
  const result = await orderService.updateOrderStatusIntoDB(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Order status updated successfully',
    data: result,
  });
});

export const orderController = {
  createOrder,
  trackOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};
