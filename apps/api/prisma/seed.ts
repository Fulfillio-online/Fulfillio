import { PrismaClient, UserRole, MerchantStatus, OrderStatus, CourierProvider, StockMovementReason } from '@prisma/client';
import { PackagingType } from '@fulfillio/contracts';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Fulfillio Database Seeding...');

  // 1. Seed Super Admin & Test Users
  const passwordHash = await bcrypt.hash('admin123', 10);

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

  // 2. Seed Merchants
  const merchant101 = await prisma.merchant.upsert({
    where: { merchantCode: 'MC-101' },
    update: {},
    create: {
      merchantCode: 'MC-101',
      businessName: "Sabbir's Store",
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

  const merchant102 = await prisma.merchant.upsert({
    where: { merchantCode: 'MC-102' },
    update: {},
    create: {
      merchantCode: 'MC-102',
      businessName: 'TechGear BD',
      email: 'contact@techgearbd.com',
      phone: '01911-889900',
      location: 'Bashundhara City, Panthapath, Dhaka',
      status: MerchantStatus.APPROVED,
      baseHandlingFee: 50.0,
      monthlyStorageFee: 3000.0,
      payoutAccount: {
        method: 'BANK_TRANSFER',
        bankName: 'City Bank Ltd',
        accountNumber: '110293847501',
        accountName: 'TechGear Electronics BD',
      },
    },
  });

  const merchant103 = await prisma.merchant.upsert({
    where: { merchantCode: 'MC-103' },
    update: {},
    create: {
      merchantCode: 'MC-103',
      businessName: 'Modest Wear BD',
      email: 'orders@modestwearbd.com',
      phone: '01755-667788',
      location: 'Shah Ali Plaza, Mirpur 10, Dhaka',
      status: MerchantStatus.APPROVED,
      baseHandlingFee: 40.0,
      monthlyStorageFee: 1800.0,
      payoutAccount: {
        method: 'NAGAD',
        accountNumber: '01755667788',
        accountName: 'Modest Wear Boutique',
      },
    },
  });
  console.log('✓ Merchants seeded: MC-101, MC-102, MC-103');

  // 3. Seed Merchant Users & WMS Workers
  await prisma.user.upsert({
    where: { email: 'sabbir@sabbirstore.com' },
    update: {},
    create: {
      name: 'Sabbir Ahmed',
      email: 'sabbir@sabbirstore.com',
      passwordHash,
      merchantId: merchant101.id,
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
  console.log('✓ Merchant user and WMS worker seeded');

  // 4. Seed Warehouse Locations & Shelf Bins
  const binCodes = [
    { zone: 'Z1', aisle: 'A01', rack: 'R01', shelf: 'S01', binCode: 'A-01-01', isDamaged: false },
    { zone: 'Z1', aisle: 'A01', rack: 'R02', shelf: 'S01', binCode: 'Z1-R02-S1-B04', isDamaged: false },
    { zone: 'Z1', aisle: 'A01', rack: 'R03', shelf: 'S02', binCode: 'Z1-R03-S2-B01', isDamaged: false },
    { zone: 'Z2', aisle: 'B01', rack: 'R01', shelf: 'S01', binCode: 'Z2-R01-S1-B02', isDamaged: false },
    { zone: 'Z2', aisle: 'B02', rack: 'R02', shelf: 'S01', binCode: 'Z2-R02-S1-B01', isDamaged: false },
    { zone: 'Z3', aisle: 'C01', rack: 'R04', shelf: 'S03', binCode: 'Z3-R04-S3-B05', isDamaged: false },
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

  // 5. Seed Memo / Invoice Templates
  await prisma.memoTemplate.upsert({
    where: {
      merchantId_memoCode: {
        merchantId: merchant101.id,
        memoCode: 'MEMO-DARAZ-BD',
      },
    },
    update: {},
    create: {
      merchantId: merchant101.id,
      memoCode: 'MEMO-DARAZ-BD',
      name: 'Daraz BD Branded 4x6 Slip',
      isDefault: false,
      layout: {
        paperSize: 'THERMAL_4X6',
        header: {
          storeName: "Sabbir's Store Mall",
          brandColor: '#ff5722',
          phone: '01711-223344',
          address: 'Dhanmondi, Dhaka',
          showLogo: true,
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
          thankYouMessage: 'Thank you for shopping on Daraz!',
        },
      },
    },
  });

  await prisma.memoTemplate.upsert({
    where: {
      merchantId_memoCode: {
        merchantId: merchant101.id,
        memoCode: 'MEMO-DEFAULT',
      },
    },
    update: {},
    create: {
      merchantId: merchant101.id,
      memoCode: 'MEMO-DEFAULT',
      name: 'Default Clean 4x6 Memo',
      isDefault: true,
      layout: {
        paperSize: 'THERMAL_4X6',
        header: {
          storeName: "Sabbir's Official Store",
          brandColor: '#059669',
          phone: '01711-223344',
          address: 'House 14, Road 5, Dhanmondi, Dhaka',
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
  console.log('✓ Memo templates seeded');

  // 6. Seed Products & Variants
  const product1 = await prisma.product.upsert({
    where: {
      merchantId_baseSku: {
        merchantId: merchant101.id,
        baseSku: 'MC-101-TSHIRT',
      },
    },
    update: {},
    create: {
      merchantId: merchant101.id,
      title: 'Heavyweight Drop-Shoulder Tee',
      baseSku: 'MC-101-TSHIRT',
      description: '100% 240 GSM combed cotton oversized streetwear tee.',
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

  const product2 = await prisma.product.upsert({
    where: {
      merchantId_baseSku: {
        merchantId: merchant102.id,
        baseSku: 'MC-102-EARBUD',
      },
    },
    update: {},
    create: {
      merchantId: merchant102.id,
      title: 'ANC Wireless Earbuds Pro V2',
      baseSku: 'MC-102-EARBUD',
      description: 'Active Noise Cancellation Bluetooth 5.3 Earbuds.',
    },
  });

  const variant2 = await prisma.productVariant.upsert({
    where: { sku: 'MC-102-EARBUD-PRO-BLK' },
    update: {},
    create: {
      productId: product2.id,
      sku: 'MC-102-EARBUD-PRO-BLK',
      barcode: '89410200201',
      title: 'Matte Black / Standard',
      price: 1850.0,
      wholesalePrice: 1250.0,
      defaultBinCode: 'Z2-R01-S1-B02',
      attributes: { color: 'Matte Black', size: 'STD' },
    },
  });

  // 7. Seed Inventory Items
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

  const loc2 = locationsMap.get('Z2-R01-S1-B02');
  if (loc2) {
    await prisma.inventoryItem.upsert({
      where: {
        variantId_locationId: {
          variantId: variant2.id,
          locationId: loc2,
        },
      },
      update: {},
      create: {
        variantId: variant2.id,
        locationId: loc2,
        quantityAvailable: 85,
        quantityReserved: 2,
        reorderPoint: 15,
      },
    });
  }
  console.log('✓ Products, variants and initial inventory stock seeded');

  // 8. Seed Sample Dispatched Order with Courier details
  await prisma.order.upsert({
    where: { id: 'ORD-99201' },
    update: {},
    create: {
      id: 'ORD-99201',
      merchantId: merchant101.id,
      customerName: 'Tanvir Hossain',
      customerPhone: '01712-984512',
      customerAddress: 'Flat 4B, House 22, Block C, Banani, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.PACKED,
      memoCode: 'MEMO-DARAZ-BD',
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
  console.log('✓ Demo order ORD-99201 seeded with Steadfast consignment');

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
