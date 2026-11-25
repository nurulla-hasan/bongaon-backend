import { prisma } from '../../lib/prisma';
import type { UpdateSettingsInput } from './setting.validation';

const DEFAULT_SETTINGS_ID = 'default';

const getSettingsFromDB = async () => {
  return prisma.storeSetting.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {},
    create: { id: DEFAULT_SETTINGS_ID },
  });
};

const updateSettingsIntoDB = async (payload: UpdateSettingsInput) => {
  return prisma.storeSetting.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: payload,
    create: {
      id: DEFAULT_SETTINGS_ID,
      ...payload,
    },
  });
};

export const settingService = {
  getSettingsFromDB,
  updateSettingsIntoDB,
};
