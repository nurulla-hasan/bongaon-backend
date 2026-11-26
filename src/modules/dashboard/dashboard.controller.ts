import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { dashboardService } from './dashboard.service';

const getDashboardOverview: RequestHandler = catchAsync(async (_req, res) => {
  const result = await dashboardService.getDashboardOverviewFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Dashboard overview retrieved successfully',
    data: result,
  });
});

export const dashboardController = {
  getDashboardOverview,
};
