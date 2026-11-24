import bcrypt from 'bcryptjs';
import type { Prisma } from '../../generated/prisma/client';
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

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));

    const shutkiId = categoryBySlug.get('shutki-bhorta');
    const gheeId = categoryBySlug.get('ghee-oil');
    const gurId = categoryBySlug.get('gur-honey');

    const sampleProducts: Prisma.ProductCreateManyInput[] = [];

    if (shutkiId) {
      sampleProducts.push({
        name: 'Special Churi Shutki Bhorta (Ready Pack)',
        slug: 'churi-shutki-bhorta',
        shortTag: 'Best Seller',
        badge: 'Best Seller',
        categoryId: shutkiId,
        price: 320,
        originalPrice: 380,
        unit: '250g',
        stock: 40,
        deliveryDays: '4-7 Days',
        shelfLife: '30 days in fridge / 3 months frozen',
        origin: "Bongaon, Cox's Bazar-style homemade recipe",
        description:
          'Roasted over a clay stove and hand-mashed pure Churi Shutki bhorta in a vacuum-sealed food-grade pack. Ready to enjoy with hot steamed rice.',
        highlights: [
          'Zero preservatives or artificial colors',
          'Double-layer vacuum & air-tight packaging',
          'Ready to serve with steamed rice or khichuri',
        ],
        ingredients: [
          'Pure Churi Shutki',
          'Roasted local onion & garlic',
          'Dried red chili',
          'Pure mustard oil',
          'Salt',
        ],
        packOptions: [
          { label: '250g', price: 320, originalPrice: 380 },
          { label: '500g', price: 610, originalPrice: 720 },
          { label: '1kg', price: 1180, originalPrice: 1400 },
        ],
        rating: 4.9,
        reviewCount: 142,
        isFeatured: true,
        isActive: true,
      });
    }

    if (gheeId) {
      sampleProducts.push({
        name: 'Pure Granular Gawa Ghee',
        slug: 'pure-gawa-ghee',
        shortTag: '100% Pure',
        badge: '100% Pure',
        categoryId: gheeId,
        price: 780,
        originalPrice: 850,
        unit: '500g',
        stock: 25,
        deliveryDays: '4-7 Days',
        shelfLife: '6 months at room temperature',
        origin: 'Sirajganj & Pabna village dairy',
        description:
          'Slow-simmered traditional granular gawa ghee made from fresh cow milk cream with rich aroma and authentic golden texture.',
        highlights: [
          'Zero palm oil or artificial essence',
          'Sealed glass jar packaging',
          'Rich granular texture',
        ],
        ingredients: ['100% Pure Cow Milk Cream'],
        packOptions: [
          { label: '250g', price: 420, originalPrice: 460 },
          { label: '500g', price: 780, originalPrice: 850 },
          { label: '1kg', price: 1500, originalPrice: 1650 },
        ],
        rating: 4.9,
        reviewCount: 98,
        isFeatured: true,
        isActive: true,
      });
    }

    if (gurId) {
      sampleProducts.push({
        name: 'Jashore Patali Date Jaggery',
        slug: 'jashore-patali-gur',
        shortTag: 'Seasonal Special',
        badge: 'Fresh Batch',
        categoryId: gurId,
        price: 450,
        originalPrice: 520,
        unit: '1kg',
        stock: 30,
        deliveryDays: '4-7 Days',
        shelfLife: '4 months in airtight container',
        origin: 'Jashore & Chuadanga',
        description:
          'Authentic winter patali khejur gur boiled from pure date palm sap without any added sugar or chemicals.',
        highlights: [
          'Zero added sugar or bleaching agents',
          'Direct from Jashore gachis',
          'Food-grade moisture-locked box',
        ],
        ingredients: ['100% Pure Date Palm Sap'],
        packOptions: [
          { label: '500g', price: 240, originalPrice: 280 },
          { label: '1kg', price: 450, originalPrice: 520 },
          { label: '2kg', price: 860, originalPrice: 980 },
        ],
        rating: 4.8,
        reviewCount: 76,
        isFeatured: true,
        isActive: true,
      });
    }

    if (sampleProducts.length > 0) {
      await prisma.product.createMany({ data: sampleProducts });
      console.log(`[Seed] Created ${sampleProducts.length} default products`);
    }
  }
};

export const seedAdmin = seed;
