import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { settingController } from './setting.controller';
import { updateSettingsSchema } from './setting.validation';

export const settingRouter = Router();

// Get store settings (Public)
settingRouter.get('/', settingController.getSettings);

// Update store settings (Admin)
settingRouter.patch(
  '/',
  auth('ADMIN'),
  validate(updateSettingsSchema),
  settingController.updateSettings,
);
