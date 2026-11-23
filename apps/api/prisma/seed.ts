import { PrismaClient } from '@prisma/client';
import { UserRole, MerchantStatus, OrderStatus, CourierProvider } from '@fulfillio/contracts';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Fulfillio Database Seeding (Single Demo Merchant Mode)...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Seed Super Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@fulfillio.online' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@fulfillio.online',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });
  console.log('✓ Super Admin created:', adminUser.email);

  // 2. Seed Single Demo Merchant (MC-101)
  const demoMerchant = await prisma.merchant.upsert({
    where: { merchantCode: 'MC-101' },
    update: {},
    create: {
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
      ownerName: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      phone: '01711-223344',
      location: 'Dhanmondi, Dhaka',
      status: MerchantStatus.APPROVED,
      baseHandlingFee: 45.0,
      monthlyStorageFee: 2200.0,
      payoutAccount: {
        method: 'BKASH',
        accountNumber: '01711223344',
        accountName: "Sabbir's Store Ltd",
      },
    },
  });
  console.log('✓ Single Demo Merchant seeded: MC-101');

  // 3. Seed Demo Merchant User & 1 Warehouse Operator
  await prisma.user.upsert({
    where: { email: 'sabbir@sabbirstore.com' },
    update: {},
    create: {
      name: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      passwordHash,
      merchantId: demoMerchant.id,
      role: UserRole.MERCHANT,
    },
  });

  await prisma.user.upsert({
    where: { email: 'jasim@fulfillio.online' },
    update: {},
    create: {
      name: 'Jasim Uddin',
      email: 'jasim@fulfillio.online',
      passwordHash,
      workerPin: '1234',
      role: UserRole.WAREHOUSE_OPERATOR,
    },
  });
  console.log('✓ Demo Merchant user and WMS operator seeded');

  // 4. Seed Warehouse Locations & Shelf Bins
  const binCodes = [
    { zone: 'Z1', aisle: 'A01', rack: 'R01', shelf: 'S01', binCode: 'A-01-01', isDamaged: false },
    { zone: 'Z1', aisle: 'A01', rack: 'R02', shelf: 'S01', binCode: 'Z1-R02-S1-B04', isDamaged: false },
    { zone: 'DMG', aisle: 'Q01', rack: 'R01', shelf: 'S01', binCode: 'DMG-01', isDamaged: true },
  ];

  const locationsMap = new Map<string, string>();
  for (const b of binCodes) {
    const loc = await prisma.inventoryLocation.upsert({
      where: { binCode: b.binCode },
      update: {},
      create: b,
    });
    locationsMap.set(b.binCode, loc.id);
  }
  console.log('✓ Warehouse bin locations seeded');

  // 5. Seed Default Memo Template for Demo Merchant
  await prisma.memoTemplate.upsert({
    where: {
      merchantId_memoCode: {
        merchantId: demoMerchant.id,
        memoCode: 'MEMO-DEFAULT',
      },
    },
    update: {},
    create: {
      merchantId: demoMerchant.id,
      memoCode: 'MEMO-DEFAULT',
      name: 'Default Clean 4x6 Memo',
      isDefault: true,
      layout: {
        paperSize: 'THERMAL_4X6',
        header: {
          storeName: "Sabbir's Store",
          brandColor: '#ea580c',
          phone: '01711-223344',
          address: 'Dhanmondi, Dhaka',
          showLogo: false,
        },
        fields: {
          showBarcode: true,
          showCourierSlip: true,
          showCustomerNotes: true,
          showSKU: true,
          showUnitPrice: true,
          showTaxTotal: false,
        },
        footer: {
          thankYouMessage: 'Thank you for ordering with us!',
        },
      },
    },
  });
  console.log('✓ Default memo template seeded');

  // 6. Seed Demo Merchant Product, Variant & Inventory
  const product1 = await prisma.product.upsert({
    where: {
      merchantId_baseSku: {
        merchantId: demoMerchant.id,
        baseSku: 'MC-101-TSHIRT',
      },
    },
    update: {},
    create: {
      merchantId: demoMerchant.id,
      title: 'Heavyweight Drop-Shoulder Tee',
      baseSku: 'MC-101-TSHIRT',
      description: '100% 240 GSM combed cotton oversized streetwear tee.',
      lifecycleStatus: 'ACTIVE',
      status: 'PUBLISHED',
    },
  });

  const variant1 = await prisma.productVariant.upsert({
    where: { sku: 'MC-101-TSHIRT-BLK-XL' },
    update: {},
    create: {
      productId: product1.id,
      sku: 'MC-101-TSHIRT-BLK-XL',
      barcode: '89410100101',
      title: 'Jet Black / XL',
      price: 725.0,
      wholesalePrice: 500.0,
      defaultBinCode: 'Z1-R02-S1-B04',
      attributes: { color: 'Jet Black', size: 'XL' },
    },
  });

  const loc1 = locationsMap.get('Z1-R02-S1-B04');
  if (loc1) {
    await prisma.inventoryItem.upsert({
      where: {
        variantId_locationId: {
          variantId: variant1.id,
          locationId: loc1,
        },
      },
      update: {},
      create: {
        variantId: variant1.id,
        locationId: loc1,
        quantityAvailable: 150,
        quantityReserved: 5,
        reorderPoint: 20,
      },
    });
  }
  console.log('✓ Demo product, variant, and inventory seeded');

  // 7. Seed 1 Sample Order for Demo Merchant
  await prisma.order.upsert({
    where: { id: 'ORD-99201' },
    update: {},
    create: {
      id: 'ORD-99201',
      merchantId: demoMerchant.id,
      customerName: 'Tanvir Hossain',
      customerPhone: '01712-984512',
      customerAddress: 'Flat 4B, House 22, Block C, Banani, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.PACKED,
      memoCode: 'MEMO-DEFAULT',
      isMemoPrinted: true,
      packagingType: 'POLY_MEDIUM',
      courierProvider: CourierProvider.STEADFAST,
      consignmentId: 'CN-849201',
      trackingCode: 'TRK-STE-99201',
      totalAmount: 1450.0,
      codAmount: 1450.0,
      items: {
        create: [
          {
            variantId: variant1.id,
            quantity: 2,
            unitPrice: 725.0,
            isVerifiedAtPacking: true,
          },
        ],
      },
    },
  });
  console.log('✓ Demo order ORD-99201 seeded');

  console.log('🎉 Fulfillio Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
