import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';
import { settingService } from './setting.service';

const getSettings: RequestHandler = catchAsync(async (_req, res) => {
  const result = await settingService.getSettingsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Store settings retrieved successfully',
    data: result,
  });
});

const uploadHeroBannerImage: RequestHandler = catchAsync(async (req, res) => {
  const result = await settingService.uploadHeroBannerImageIntoCloudinary(req.file);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Hero banner image uploaded successfully',
    data: result,
  });
});

const updateSettings: RequestHandler = catchAsync(async (req, res) => {
  const result = await settingService.updateSettingsIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Store settings updated successfully',
    data: result,
  });
});

export const settingController = {
  getSettings,
  uploadHeroBannerImage,
  updateSettings,
};
