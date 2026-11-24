import { PrismaClient } from '@prisma/client';
import {
  CourierProvider,
  FinanceEntryCategory,
  FinanceEntryType,
  MerchantStatus,
  OrderStatus,
} from '@fulfillio/contracts';

const prisma = new PrismaClient();
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

async function main() {
  const now = new Date();
  console.log('🌱 Seeding Demo Data for Finance & Analytics + Live Operations Dashboard...');

  // 1. Ensure primary merchant MC-101 exists
  const mc101 = await prisma.merchant.upsert({
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
      baseHandlingFee: 45,
      monthlyStorageFee: 2200,
    },
  });

  // 2. Ensure a second demo merchant MC-102 exists for multi-merchant breakdown testing
  const mc102 = await prisma.merchant.upsert({
    where: { merchantCode: 'MC-102' },
    update: {},
    create: {
      merchantCode: 'MC-102',
      businessName: 'Dhaka Gadget Mart',
      ownerName: 'Tariqul Islam',
      email: 'tariq@dhakagadget.com',
      phone: '01812-556677',
      location: 'Banani, Dhaka',
      status: MerchantStatus.APPROVED,
      baseHandlingFee: 50,
      monthlyStorageFee: 2500,
    },
  });

  // 3. Seed Company Finance Ledger Entries (idempotent via unique entryCode)
  const financeEntries = [
    {
      entryCode: 'FIN-DEMO-RENT-01',
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.RENT,
      title: 'Mirpur Central Warehouse Rent (Current Month)',
      amount: 12000,
      entryDate: new Date(now.getFullYear(), now.getMonth(), 2, 10, 0, 0),
      merchantId: null,
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'RENT-2026-11',
      notes: 'Monthly facility lease payment',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-SAL-01',
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.SALARY,
      title: 'Warehouse Pickers & Packers Payroll',
      amount: 9500,
      entryDate: new Date(now.getFullYear(), now.getMonth(), 5, 14, 0, 0),
      merchantId: null,
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'PAYROLL-NOV-W1',
      notes: '4 floor operators',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-COUR-01',
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.COURIER_COST,
      title: 'Steadfast & Pathao Courier Charge Settlement',
      amount: 4200,
      entryDate: new Date(now.getTime() - 3 * DAY_MS),
      merchantId: null,
      paymentMethod: 'BKASH',
      referenceNo: 'COUR-SET-881',
      notes: 'Weekly courier invoice settlement',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-PKG-01',
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.PACKAGING_PURCHASE,
      title: 'Corrugated Boxes, Polybags & 4x6 Thermal Rolls',
      amount: 1850,
      entryDate: new Date(now.getTime() - 2 * DAY_MS),
      merchantId: null,
      paymentMethod: 'CASH',
      referenceNo: 'PKG-4402',
      notes: 'Bulk stock purchase for packing desk',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-UTIL-01',
      type: FinanceEntryType.EXPENSE,
      category: FinanceEntryCategory.UTILITY_MISC,
      title: 'Electricity, Fiber Internet & Cloud Hosting',
      amount: 1450,
      entryDate: new Date(now.getTime() - 1 * DAY_MS),
      merchantId: null,
      paymentMethod: 'NAGAD',
      referenceNo: 'UTIL-1120',
      notes: 'Monthly utilities',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-STR-101',
      type: FinanceEntryType.INCOME,
      category: FinanceEntryCategory.STORAGE_FEE,
      title: "Monthly Rack & Bin Storage Fee — Sabbir's Store",
      amount: 2200,
      entryDate: new Date(now.getTime() - 4 * DAY_MS),
      merchantId: mc101.id,
      paymentMethod: 'BANK_TRANSFER',
      referenceNo: 'STR-MC101-NOV',
      notes: '2 pallet bays + shelf bins',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-STR-102',
      type: FinanceEntryType.INCOME,
      category: FinanceEntryCategory.STORAGE_FEE,
      title: 'Monthly Rack & Bin Storage Fee — Dhaka Gadget Mart',
      amount: 2500,
      entryDate: new Date(now.getTime() - 2 * DAY_MS),
      merchantId: mc102.id,
      paymentMethod: 'BKASH',
      referenceNo: 'STR-MC102-NOV',
      notes: 'Dedicated electronics cage',
      createdByAdminName: 'Super Admin',
    },
    {
      entryCode: 'FIN-DEMO-OTH-01',
      type: FinanceEntryType.INCOME,
      category: FinanceEntryCategory.OTHER_INCOME,
      title: 'Custom Branded Memo & Sticker Setup Fee',
      amount: 1200,
      entryDate: now,
      merchantId: mc102.id,
      paymentMethod: 'BKASH',
      referenceNo: 'SETUP-2026',
      notes: 'One-time onboarding branding',
      createdByAdminName: 'Super Admin',
    },
  ];

  for (const entry of financeEntries) {
    await prisma.companyFinanceEntry.upsert({
      where: { entryCode: entry.entryCode },
      update: {},
      create: entry,
    });
  }
  console.log(`✓ Upserted ${financeEntries.length} company finance ledger entries`);

  // 4. Seed Live Operational & Delivered Orders for Today & Recent Days (idempotent)
  const demoOrders = [
    {
      externalOrderId: 'DEMO-OPS-101',
      merchantId: mc101.id,
      customerName: 'Nafis Chowdhury',
      customerPhone: '01715882211',
      customerAddress: 'Road 9, Banani, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.PENDING,
      courierProvider: CourierProvider.STEADFAST,
      totalAmount: 1510,
      codAmount: 1510,
      deliveryFee: 60,
      packagingCost: 10,
      createdAt: new Date(now.getTime() - 2 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-102',
      merchantId: mc102.id,
      customerName: 'Farhana Yasmin',
      customerPhone: '01819443322',
      customerAddress: 'Gulshan Avenue, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.PENDING,
      courierProvider: CourierProvider.PATHAO,
      totalAmount: 2480,
      codAmount: 2480,
      deliveryFee: 80,
      packagingCost: 15,
      createdAt: new Date(now.getTime() - 1 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-103',
      merchantId: mc101.id,
      customerName: 'Tariqul Islam',
      customerPhone: '01911665544',
      customerAddress: 'Mirpur DOHS, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.PACKED,
      courierProvider: CourierProvider.STEADFAST,
      totalAmount: 1350,
      codAmount: 1350,
      deliveryFee: 60,
      packagingCost: 10,
      createdAt: new Date(now.getTime() - 3 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-104',
      merchantId: mc102.id,
      customerName: 'Samira Rahman',
      customerPhone: '01614229900',
      customerAddress: 'Dhanmondi 27, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.DISPATCHED,
      courierProvider: CourierProvider.STEADFAST,
      totalAmount: 3200,
      codAmount: 3200,
      deliveryFee: 60,
      packagingCost: 15,
      createdAt: new Date(now.getTime() - 18 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-105',
      merchantId: mc101.id,
      customerName: 'Mehedi Hasan',
      customerPhone: '01722334455',
      customerAddress: 'Sector 11, Uttara, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.DISPATCHED,
      courierProvider: CourierProvider.PATHAO,
      totalAmount: 1890,
      codAmount: 1890,
      deliveryFee: 80,
      packagingCost: 10,
      createdAt: new Date(now.getTime() - 20 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-106',
      merchantId: mc102.id,
      customerName: 'Shafiqul Alam',
      customerPhone: '01955884433',
      customerAddress: 'Agrabad C/A, Chattogram',
      city: 'Chattogram',
      status: OrderStatus.DISPATCHED,
      courierProvider: CourierProvider.REDX,
      totalAmount: 2750,
      codAmount: 2750,
      deliveryFee: 120,
      packagingCost: 15,
      createdAt: new Date(now.getTime() - 26 * HOUR_MS),
    },
    {
      externalOrderId: 'DEMO-OPS-107',
      merchantId: mc101.id,
      customerName: 'Nadia Karim',
      customerPhone: '01844778899',
      customerAddress: 'Bashundhara R/A, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.DELIVERED,
      courierProvider: CourierProvider.STEADFAST,
      totalAmount: 1960,
      codAmount: 1960,
      deliveryFee: 60,
      packagingCost: 10,
      createdAt: new Date(now.getTime() - 6 * HOUR_MS),
      deliveredAt: now,
    },
    {
      externalOrderId: 'DEMO-OPS-108',
      merchantId: mc102.id,
      customerName: 'Rashedul Haque',
      customerPhone: '01788123456',
      customerAddress: 'Baridhara DOHS, Dhaka',
      city: 'Dhaka',
      status: OrderStatus.DELIVERED,
      courierProvider: CourierProvider.PATHAO,
      totalAmount: 3580,
      codAmount: 3580,
      deliveryFee: 80,
      packagingCost: 15,
      createdAt: new Date(now.getTime() - 7 * HOUR_MS),
      deliveredAt: now,
    },
    {
      externalOrderId: 'DEMO-OPS-109',
      merchantId: mc102.id,
      customerName: 'Tahmina Sultana',
      customerPhone: '01822987654',
      customerAddress: 'Zindabazar, Sylhet',
      city: 'Sylhet',
      status: OrderStatus.RETURNED,
      courierProvider: CourierProvider.REDX,
      totalAmount: 1620,
      codAmount: 1620,
      deliveryFee: 120,
      packagingCost: 10,
      createdAt: new Date(now.getTime() - 2 * DAY_MS),
      returnedAt: new Date(now.getTime() - 5 * HOUR_MS),
    },
  ];

  let createdOrdersCount = 0;
  for (const ord of demoOrders) {
    const existing = await prisma.order.findFirst({
      where: { externalOrderId: ord.externalOrderId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.order.create({
        data: {
          merchantId: ord.merchantId,
          externalOrderId: ord.externalOrderId,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          customerAddress: ord.customerAddress,
          city: ord.city,
          status: ord.status as any,
          courierProvider: ord.courierProvider as any,
          totalAmount: ord.totalAmount,
          codAmount: ord.codAmount,
          deliveryFee: ord.deliveryFee,
          packagingCost: ord.packagingCost,
          createdAt: ord.createdAt,
          deliveredAt: (ord as any).deliveredAt || null,
          returnedAt: (ord as any).returnedAt || null,
          items: {
            create: [
              {
                productTitle: 'Demo Fulfillment Item',
                variantLabel: 'Standard',
                sku: `${ord.externalOrderId}-SKU`,
                quantity: 1,
                unitPrice: ord.totalAmount - ord.deliveryFee,
              },
            ],
          },
        },
      });
      createdOrdersCount++;
    }
  }
  console.log(`✓ Created ${createdOrdersCount} new demo operational/delivered orders (skipped existing)`);

  // 5. Log a couple of ActivityLog items if empty so the Live Feed looks realistic immediately
  const activityCount = await prisma.activityLog.count();
  if (activityCount === 0) {
    await prisma.activityLog.createMany({
      data: [
        {
          action: 'ORDER_DELIVERED',
          entityType: 'Order',
          entityId: 'DEMO-OPS-107',
          notes: "Steadfast delivered DEMO-OPS-107 (৳1,960 COD) for Sabbir's Store",
          createdAt: new Date(now.getTime() - 15 * 60 * 1000),
        },
        {
          action: 'FINANCE_ENTRY_LOGGED',
          entityType: 'CompanyFinanceEntry',
          entityId: 'FIN-DEMO-OTH-01',
          notes: 'Logged ৳1,200 setup fee income for Dhaka Gadget Mart',
          createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        },
        {
          action: 'ORDER_DISPATCHED',
          entityType: 'Order',
          entityId: 'DEMO-OPS-104',
          notes: 'Handed over DEMO-OPS-104 parcel to Steadfast Courier',
          createdAt: new Date(now.getTime() - 2 * HOUR_MS),
        },
      ],
    });
    console.log('✓ Seeded initial ActivityLog entries');
  }

  console.log('✅ Demo data seeding completed! Visit /admin and /admin/finance to test.');
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
