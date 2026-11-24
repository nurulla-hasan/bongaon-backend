import bcrypt from 'bcryptjs';
import config from '../config/index';
import { prisma } from './prisma';

const DEFAULT_PASSWORD = config.admin_password || '11111111';

const DEFAULT_CATEGORIES = [
  {
    name: 'Packaged Bhorta & Shutki',
    slug: 'shutki-bhorta',
    subtitle: 'Ready-to-eat Churi, Loitta & Chepa Shutki bhorta',
    iconName: 'flame',
    sortOrder: 1,
  },
  {
    name: 'Homemade Achar & Chutney',
    slug: 'achar-chutney',
    subtitle: 'Sun-dried mango, olive & tamarind pickles',
    iconName: 'jar',
    sortOrder: 2,
  },
  {
    name: 'Pure Ghee & Mustard Oil',
    slug: 'ghee-oil',
    subtitle: 'First-press ghani oil & granular gawa ghee',
    iconName: 'droplet',
    sortOrder: 3,
  },
  {
    name: 'Date Jaggery & Honey',
    slug: 'gur-honey',
    subtitle: 'Winter patali gur & Sundarbans raw honey',
    iconName: 'sparkles',
    sortOrder: 4,
  },
  {
    name: 'Whole & Ground Spices',
    slug: 'village-spices',
    subtitle: 'Village-milled turmeric, chili & coriander',
    iconName: 'package',
    sortOrder: 5,
  },
  {
    name: 'Probashi Family Combo',
    slug: 'probashi-combo',
    subtitle: 'Curated gift packs for your family back home',
    iconName: 'gift',
    sortOrder: 6,
  },
];

export const seed = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const adminEmail = config.admin_email || 'admin@bongaonbajar.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: config.admin_name || 'System Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        status: 'ACTIVE',
      },
    });
    console.log(`[Seed] Admin created successfully: ${adminEmail}`);
  } else {
    console.log(`[Seed] Admin already exists: ${adminEmail}`);
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES,
    });
    console.log(`[Seed] Created ${DEFAULT_CATEGORIES.length} default categories`);
  }
};

export const seedAdmin = seed;
