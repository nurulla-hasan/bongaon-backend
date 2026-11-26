import httpStatus from 'http-status';
import { deleteFromCloudinary, uploadToCloudinary } from '../../lib/cloudinary';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import type { UpdateSettingsInput } from './setting.validation';

const DEFAULT_SETTINGS_ID = 'default';

const extractBannerPublicIds = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const item of raw) {
    if (typeof item === 'object' && item !== null && 'imagePublicId' in item) {
      const publicId = (item as { imagePublicId?: unknown }).imagePublicId;
      if (typeof publicId === 'string' && publicId.trim().length > 0) {
        ids.push(publicId.trim());
      }
    }
  }
  return ids;
};

const getSettingsFromDB = async () => {
  return prisma.storeSetting.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {},
    create: { id: DEFAULT_SETTINGS_ID },
  });
};

const uploadHeroBannerImageIntoCloudinary = async (file?: Express.Multer.File) => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please upload an image file');
  }

  const result = await uploadToCloudinary(file.buffer, 'bongaon-bajar/banners');

  return {
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  };
};

const updateSettingsIntoDB = async (payload: UpdateSettingsInput) => {
  let removedBannerPublicIds: string[] = [];

  if (payload.heroBanners !== undefined) {
    const existing = await prisma.storeSetting.findUnique({
      where: { id: DEFAULT_SETTINGS_ID },
      select: { heroBanners: true },
    });

    const previousIds = extractBannerPublicIds(existing?.heroBanners);
    const nextIdSet = new Set(extractBannerPublicIds(payload.heroBanners));
    removedBannerPublicIds = previousIds.filter((id) => !nextIdSet.has(id));
  }

  const updated = await prisma.storeSetting.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: payload,
    create: {
      id: DEFAULT_SETTINGS_ID,
      ...payload,
    },
  });

  if (removedBannerPublicIds.length > 0) {
    await Promise.allSettled(
      removedBannerPublicIds.map((publicId) => deleteFromCloudinary(publicId)),
    );
  }

  return updated;
};

export const settingService = {
  getSettingsFromDB,
  uploadHeroBannerImageIntoCloudinary,
  updateSettingsIntoDB,
};
