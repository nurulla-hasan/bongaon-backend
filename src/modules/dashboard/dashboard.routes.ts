import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { dashboardController } from './dashboard.controller';

export const dashboardRouter = Router();

// Get admin dashboard overview metrics (Admin)
dashboardRouter.get('/overview', auth('ADMIN'), dashboardController.getDashboardOverview);
