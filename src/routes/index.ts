import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { categoryRouter } from '../modules/category/category.routes';
import { orderRouter } from '../modules/order/order.routes';
import { productRouter } from '../modules/product/product.routes';
import { reviewRouter } from '../modules/review/review.routes';
import { userRouter } from '../modules/user/user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/reviews', reviewRouter);
