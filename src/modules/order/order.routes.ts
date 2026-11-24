import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate, validateQuery } from '../../middlewares/validate';
import { orderController } from './order.controller';
import {
  createOrderSchema,
  getMyOrdersQuerySchema,
  getOrdersQuerySchema,
  trackOrderQuerySchema,
  updateOrderStatusSchema,
} from './order.validation';

export const orderRouter = Router();

// Place COD order (Public - works for both guests and logged-in users)
orderRouter.post('/', validate(createOrderSchema), orderController.createOrder);

// Track order by order number and phone (Public)
orderRouter.get(
  '/track/:orderNumber',
  validateQuery(trackOrderQuerySchema),
  orderController.trackOrder,
);

// Get current logged-in user's orders
orderRouter.get(
  '/my-orders',
  auth(),
  validateQuery(getMyOrdersQuerySchema),
  orderController.getMyOrders,
);

// Get all orders (Admin)
orderRouter.get(
  '/',
  auth('ADMIN'),
  validateQuery(getOrdersQuerySchema),
  orderController.getAllOrders,
);

// Get order by ID (Admin)
orderRouter.get('/:id', auth('ADMIN'), orderController.getOrderById);

// Update order status (Admin)
orderRouter.patch(
  '/:id/status',
  auth('ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus,
);
