import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import {
  CourierProvider,
  OrderEarningStatus,
  OrderStatus,
  PayoutMethod,
  PayoutRequestStatus,
} from '@fulfillio/contracts';

const prisma = new PrismaClient();
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildReceiptSvgDataUrl(params: {
  requestCode: string;
  trxId: string;
  merchantName: string;
  merchantCode: string;
  channelLabel: string;
  destinationLabel: string;
  amount: number;
  paidAtIso: string;
}): string {
  const paidDateStr = new Date(params.paidAtIso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="380" viewBox="0 0 640 380">
  <rect width="640" height="380" rx="20" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <rect width="640" height="72" rx="20" fill="#12284C"/>
  <rect y="52" width="640" height="20" fill="#12284C"/>
  <text x="28" y="38" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">Fulfillio Digital Payout Receipt</text>
  <text x="28" y="57" font-family="Arial, sans-serif" font-size="11" fill="#fb923c">${escapeXml(params.channelLabel)}</text>
  <rect x="485" y="22" width="128" height="28" rx="14" fill="#10b981"/>
  <text x="549" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">VERIFIED PAID</text>

  <rect x="28" y="94" width="584" height="72" rx="12" fill="#fff7ed" stroke="#fdba74"/>
  <text x="48" y="120" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">DISBURSED AMOUNT (BDT)</text>
  <text x="48" y="150" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ea580c">BDT ${params.amount.toLocaleString()}</text>
  <text x="592" y="120" text-anchor="end" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">TRANSACTION ID</text>
  <text x="592" y="148" text-anchor="end" font-family="Courier New, monospace" font-size="18" font-weight="bold" fill="#0f172a">${escapeXml(params.trxId)}</text>

  <text x="28" y="200" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">MERCHANT</text>
  <text x="28" y="220" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${escapeXml(params.merchantName)} (${escapeXml(params.merchantCode)})</text>

  <text x="340" y="200" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">PAYOUT REQUEST</text>
  <text x="340" y="220" font-family="Courier New, monospace" font-size="14" font-weight="bold" fill="#0f172a">${escapeXml(params.requestCode)}</text>

  <text x="28" y="262" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">DESTINATION ACCOUNT</text>
  <text x="28" y="282" font-family="Courier New, monospace" font-size="14" font-weight="bold" fill="#0f172a">${escapeXml(params.destinationLabel)}</text>

  <text x="340" y="262" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#64748b">SETTLED AT</text>
  <text x="340" y="282" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#0f172a">${escapeXml(paidDateStr)}</text>

  <line x1="28" y1="312" x2="612" y2="312" stroke="#e2e8f0" stroke-width="1"/>
  <text x="28" y="340" font-family="Arial, sans-serif" font-size="11" fill="#64748b">Settled by Finance Admin - Fulfillio 3PL Automated Ledger</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

const CUSTOMERS = [
  { name: 'Nafis Chowdhury', phone: '01715-882211', address: 'House 14, Road 9, Banani, Dhaka', city: 'Dhaka' },
  { name: 'Farhana Yasmin', phone: '01819-443322', address: 'Flat 6A, Gulshan Avenue, Dhaka', city: 'Dhaka' },
  { name: 'Tariqul Islam', phone: '01911-665544', address: 'Mirpur DOHS, Avenue 4, Dhaka', city: 'Dhaka' },
  { name: 'Samira Rahman', phone: '01614-229900', address: 'House 31, Dhanmondi 27, Dhaka', city: 'Dhaka' },
  { name: 'Mehedi Hasan', phone: '01722-334455', address: 'Sector 11, Road 7, Uttara, Dhaka', city: 'Dhaka' },
  { name: 'Nadia Karim', phone: '01844-778899', address: 'Bashundhara R/A, Block D, Dhaka', city: 'Dhaka' },
  { name: 'Arifuzzaman Khan', phone: '01733-551122', address: 'Lalmatia Block C, Mohammadpur, Dhaka', city: 'Dhaka' },
  { name: 'Shafiqul Alam', phone: '01955-884433', address: 'Agrabad C/A, Road 3, Chattogram', city: 'Chattogram' },
  { name: 'Rashedul Haque', phone: '01788-123456', address: 'House 8, Road 12, Baridhara DOHS, Dhaka', city: 'Dhaka' },
  { name: 'Tahmina Sultana', phone: '01822-987654', address: 'Zindabazar Main Road, Sylhet', city: 'Sylhet' },
  { name: 'Mahmudul Hasan', phone: '01712-456789', address: 'Shaheb Bazar Zero Point, Rajshahi', city: 'Rajshahi' },
  { name: 'Nusrat Jahan', phone: '01918-332211', address: 'Sonadanga R/A, Phase 2, Khulna', city: 'Khulna' },
  { name: 'Tanvir Ahmed', phone: '01675-119988', address: 'Kandirpar Station Road, Cumilla', city: 'Cumilla' },
  { name: 'Sadia Afrin', phone: '01811-776655', address: 'House 22, Niketon, Gulshan 1, Dhaka', city: 'Dhaka' },
  { name: 'Kamrul Hasan', phone: '01799-445566', address: 'Chashara Link Road, Narayanganj', city: 'Narayanganj' },
  { name: 'Rumana Akter', phone: '01922-667788', address: 'Joydebpur Chowrasta, Gazipur', city: 'Gazipur' },
  { name: 'Imran Hossain', phone: '01716-990011', address: 'Flat 4B, Eskaton Garden, Dhaka', city: 'Dhaka' },
  { name: 'Tasnim Tabassum', phone: '01855-223344', address: 'Nasirabad Housing Society, Chattogram', city: 'Chattogram' },
  { name: 'Ashraful Islam', phone: '01744-556677', address: 'House 19, Road 4, Banasree, Dhaka', city: 'Dhaka' },
  { name: 'Maliha Chowdhury', phone: '01977-889900', address: 'Amberkhana Point, Sylhet', city: 'Sylhet' },
  { name: 'Zayed Al Nahian', phone: '01611-334455', address: 'House 5, Road 14, Mohakhali DOHS, Dhaka', city: 'Dhaka' },
  { name: 'Sabrina Kabir', phone: '01877-445511', address: 'GEC Circle, East Nasirabad, Chattogram', city: 'Chattogram' },
  { name: 'Faisal Mahmud', phone: '01766-112233', address: 'Road 6, Block B, Mirpur 10, Dhaka', city: 'Dhaka' },
  { name: 'Lamia Ferdous', phone: '01933-774422', address: 'House 42, Sector 7, Uttara, Dhaka', city: 'Dhaka' },
  { name: 'Sajibur Rahman', phone: '01755-668811', address: 'Padma Residential Area, Rajshahi', city: 'Rajshahi' },
];

const CATALOG_ITEMS = [
  { title: 'Heavyweight Fleece Hoodie', variant: 'Obsidian Black / XL', unitPrice: 1450 },
  { title: 'Raw Selvedge Denim Jacket', variant: 'Indigo Wash / L', unitPrice: 2850 },
  { title: 'Premium Cotton Polo Combo', variant: 'Navy & White / M', unitPrice: 980 },
  { title: 'Executive Oxford Shirt', variant: 'Crisp White / L', unitPrice: 1290 },
  { title: 'Relaxed Chino Trousers', variant: 'Khaki Beige / 32', unitPrice: 1420 },
  { title: 'Canvas Casual Sneakers', variant: 'Off White / 42', unitPrice: 1850 },
  { title: 'Winter Puffer Jacket', variant: 'Midnight Navy / XL', unitPrice: 3250 },
  { title: 'Streetwear Cargo Joggers', variant: 'Olive Green / L', unitPrice: 1380 },
  { title: 'Drop-Shoulder Graphic Tee', variant: 'Charcoal / L', unitPrice: 890 },
  { title: 'Essential Cotton Crewneck', variant: 'Heather Grey / M', unitPrice: 1120 },
  { title: 'Textured Knit Polo', variant: 'Espresso Brown / L', unitPrice: 1340 },
  { title: 'Slim Stretch Jeans', variant: 'Washed Slate / 34', unitPrice: 1650 },
  { title: 'Merino Wool Cardigan', variant: 'Sandstone / M', unitPrice: 2150 },
  { title: 'Leather Minimalist Backpack', variant: 'Matte Black / Standard', unitPrice: 2650 },
  { title: 'Structured Chino Shorts', variant: 'Stone Grey / 32', unitPrice: 950 },
  { title: 'Linen Summer Tunic Shirt', variant: 'Sky Blue / L', unitPrice: 1390 },
];

const COURIERS: CourierProvider[] = [
  CourierProvider.STEADFAST,
  CourierProvider.PATHAO,
  CourierProvider.REDX,
];

const COURIER_PREFIX: Record<string, string> = {
  STEADFAST: 'STE',
  PATHAO: 'PAT',
  REDX: 'RED',
};

const REFUND_REASONS = [
  'Customer requested size exchange / refund within return window',
  'Customer returned product after trying — size did not fit',
  'Color shade mismatch reported on delivery — refunded per return policy',
  'Customer changed mind during 3-day return window — amount reversed',
  'Parcel refused at doorstep after inspection — returned to warehouse',
];

async function main() {
  const merchant = await prisma.merchant.findFirst({
    where: { merchantCode: { equals: 'MC-101', mode: 'insensitive' } },
  });

  if (!merchant) {
    throw new Error("Merchant MC-101 (Sabbir's Store) not found in PostgreSQL database.");
  }

  console.log(`Found merchant: ${merchant.businessName} (${merchant.merchantCode}), id=${merchant.id}`);

  // Reuse existing variants belonging to MC-101, or create a fallback product + variant under MC-101
  let variants = await prisma.productVariant.findMany({
    where: { product: { merchantId: merchant.id } },
    include: { product: true },
    take: 10,
  });

  if (variants.length === 0) {
    const product = await prisma.product.upsert({
      where: {
        merchantId_baseSku: {
          merchantId: merchant.id,
          baseSku: 'MC-101-DEMO-TEE',
        },
      },
      update: {},
      create: {
        merchantId: merchant.id,
        title: 'Heavyweight Drop-Shoulder Tee',
        baseSku: 'MC-101-DEMO-TEE',
        description: 'Demo streetwear product for order & earnings testing.',
        lifecycleStatus: 'ACTIVE',
        status: 'PUBLISHED',
      },
    });

    const createdVariant = await prisma.productVariant.upsert({
      where: { sku: 'MC-101-DEMO-TEE-BLK-L' },
      update: {},
      create: {
        productId: product.id,
        sku: 'MC-101-DEMO-TEE-BLK-L',
        title: 'Jet Black / L',
        price: 850,
        wholesalePrice: 520,
        defaultBinCode: 'A-01-01',
      },
    });

    variants = [{ ...createdVariant, product }];
  }

  const pickVariant = (idx: number) => variants[idx % variants.length];
  const now = Date.now();
  const returnWindowDays = Math.max(0, Number(merchant.returnWindowDays ?? 3));
  const handlingFee = Number(merchant.baseHandlingFee) || 45;
  const payoutAcc = (merchant.payoutAccount as Record<string, any>) || {};
  const accNumber =
    payoutAcc.bkashMerchantNumber || payoutAcc.accountNumber || '01711223344';
  const accHolder = payoutAcc.accountHolder || merchant.ownerName || 'Sabbir Ahmed';

  // Scoped idempotent cleanup for demo/test records belonging to MC-101 ONLY
  const demoRequests = await prisma.payoutRequest.findMany({
    where: {
      merchantId: merchant.id,
      OR: [
        { requestCode: { startsWith: 'PR-DEMO-' } },
        { requestCode: { startsWith: 'PR-TEST-' } },
      ],
    },
    select: { id: true },
  });

  if (demoRequests.length > 0) {
    const demoReqIds = demoRequests.map((r) => r.id);
    await prisma.settlement.deleteMany({
      where: {
        merchantId: merchant.id,
        payoutRequestId: { in: demoReqIds },
      },
    });
    await prisma.payoutRequest.deleteMany({
      where: {
        merchantId: merchant.id,
        id: { in: demoReqIds },
      },
    });
  }

  await prisma.orderEarning.deleteMany({
    where: {
      merchantId: merchant.id,
      OR: [
        { orderId: { startsWith: 'ORD-DEMO-' } },
        { orderId: { startsWith: 'ORD-TEST-' } },
      ],
    },
  });

  await prisma.orderItem.deleteMany({
    where: {
      OR: [
        { orderId: { startsWith: 'ORD-DEMO-' } },
        { orderId: { startsWith: 'ORD-TEST-' } },
      ],
    },
  });

  await prisma.order.deleteMany({
    where: {
      merchantId: merchant.id,
      OR: [
        { id: { startsWith: 'ORD-DEMO-' } },
        { id: { startsWith: 'ORD-TEST-' } },
      ],
    },
  });

  const orderRows: any[] = [];
  const orderItemRows: any[] = [];
  const earningRows: any[] = [];

  let readyTotalNet = 0;
  let pendingTotalNet = 0;
  let claimedTotalNet = 0;
  let refundedTotalNet = 0;

  // Build exactly 100 realistic orders:
  // 001..045 (45): DELIVERED -> READY_TO_CLAIM (window expired)
  // 046..065 (20): DELIVERED -> PENDING (inside 3-day return hold)
  // 066..080 (15): DELIVERED -> CLAIMED (in wallet / historical)
  // 081..090 (10): RETURNED  -> REFUNDED
  // 091..096 (06): DISPATCHED (in transit, no earning yet)
  // 097..100 (04): ALLOCATED  (confirmed/packed queue, no earning yet)
  for (let i = 0; i < 100; i++) {
    const numStr = String(i + 1).padStart(3, '0');
    const orderId = `ORD-TEST-${numStr}`;
    const customer = CUSTOMERS[(i * 7 + 3) % CUSTOMERS.length];
    const catalog = CATALOG_ITEMS[(i * 5 + 1) % CATALOG_ITEMS.length];
    const variant = pickVariant(i);
    const courier = COURIERS[i % COURIERS.length];
    const courierTag = COURIER_PREFIX[courier];
    const deliveryFee = customer.city === 'Dhaka' ? 60 : 120;

    let status: OrderStatus;
    let earningStatus: OrderEarningStatus | null = null;
    let qty = (i % 2) + 1;
    let unitPrice = catalog.unitPrice;
    let deliveredAt: Date | null = null;
    let returnedAt: Date | null = null;
    let claimedAt: Date | null = null;
    let createdAt: Date;
    let refundReason: string | null = null;

    if (i < 45) {
      // 45 READY_TO_CLAIM orders (first 25 spread across this month Days 1..20 so all weekly buckets render bars)
      const localIdx = i;
      status = OrderStatus.DELIVERED;
      earningStatus = OrderEarningStatus.READY_TO_CLAIM;
      const daysAgo =
        localIdx < 25
          ? 4 + Math.floor((localIdx * 19) / 24) // 4 to 23 days ago
          : 24 + Math.floor(((localIdx - 25) * 34) / 19); // 24 to 58 days ago
      const hourOffset = (localIdx * 5) % 18;
      deliveredAt = new Date(now - daysAgo * DAY_MS - hourOffset * HOUR_MS);
      createdAt = new Date(deliveredAt.getTime() - 2 * DAY_MS);
      qty = (localIdx % 3) === 0 ? 2 : 1;
    } else if (i < 65) {
      // 20 PENDING Return-Window Hold orders (delivered 3h to ~63.8h ago, inside 72h return hold)
      const localIdx = i - 45;
      status = OrderStatus.DELIVERED;
      earningStatus = OrderEarningStatus.PENDING;
      const hoursAgo = 3 + localIdx * 3.2;
      deliveredAt = new Date(now - Math.round(hoursAgo * HOUR_MS));
      createdAt = new Date(deliveredAt.getTime() - 2 * DAY_MS);
      qty = (localIdx % 2) + 1;
    } else if (i < 80) {
      // 15 CLAIMED orders across last ~5 months (higher-value multi-unit orders so claimed sum ~৳60,000+)
      const localIdx = i - 65;
      status = OrderStatus.DELIVERED;
      earningStatus = OrderEarningStatus.CLAIMED;
      const daysAgo = 10 + localIdx * 9;
      deliveredAt = new Date(now - daysAgo * DAY_MS - ((localIdx * 4) % 12) * HOUR_MS);
      claimedAt = new Date(deliveredAt.getTime() + (returnWindowDays + 1) * DAY_MS);
      createdAt = new Date(deliveredAt.getTime() - 2 * DAY_MS);
      qty = localIdx % 2 === 0 ? 3 : 4;
      unitPrice = Math.max(1350, catalog.unitPrice);
    } else if (i < 90) {
      // 10 RETURNED -> REFUNDED orders
      const localIdx = i - 80;
      status = OrderStatus.RETURNED;
      earningStatus = OrderEarningStatus.REFUNDED;
      const daysAgo = 5 + localIdx * 4;
      deliveredAt = new Date(now - daysAgo * DAY_MS);
      returnedAt = new Date(deliveredAt.getTime() + 28 * HOUR_MS);
      createdAt = new Date(deliveredAt.getTime() - 2 * DAY_MS);
      refundReason = REFUND_REASONS[localIdx % REFUND_REASONS.length];
    } else if (i < 96) {
      // 6 DISPATCHED in-transit orders (ready for /admin/delivery Mark Delivered / Returned testing)
      const localIdx = i - 90;
      status = OrderStatus.DISPATCHED;
      createdAt = new Date(now - (18 + localIdx * 6) * HOUR_MS);
    } else {
      // 4 ALLOCATED confirmed orders (in warehouse queue)
      const localIdx = i - 96;
      status = OrderStatus.ALLOCATED;
      createdAt = new Date(now - (4 + localIdx * 3) * HOUR_MS);
    }

    const subtotal = unitPrice * qty;
    const totalAmount = subtotal + deliveryFee;
    const packagingCost = qty >= 2 ? 10 : 5;
    const packagingType = packagingCost > 5 ? 'BOX_MEDIUM' : 'POLY_SMALL';
    const isAllocated = status === OrderStatus.ALLOCATED;

    const trackingCode = isAllocated ? null : `TRK-${courierTag}-T${numStr}`;
    const consignmentId = isAllocated ? null : `CN-880${numStr}`;

    orderRows.push({
      id: orderId,
      merchantId: merchant.id,
      externalOrderId: orderId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      city: customer.city,
      status,
      memoCode: 'MEMO-DEFAULT',
      isMemoPrinted: !isAllocated,
      memoPrintedAt: !isAllocated ? new Date(createdAt.getTime() + 2 * HOUR_MS) : null,
      packagingType,
      packagingCost,
      courierProvider: courier,
      consignmentId,
      trackingCode,
      totalAmount,
      codAmount: totalAmount,
      subtotal,
      deliveryFee,
      paymentMethod: 'Cash on Delivery',
      paymentStatus:
        status === OrderStatus.DELIVERED
          ? 'Paid'
          : status === OrderStatus.RETURNED
            ? 'Refunded'
            : 'Unpaid',
      deliveredAt,
      returnedAt,
      createdAt,
      updatedAt: returnedAt ?? deliveredAt ?? createdAt,
    });

    orderItemRows.push({
      orderId,
      variantId: variant.id,
      productTitle: catalog.title,
      variantLabel: catalog.variant,
      sku: variant.sku,
      quantity: qty,
      unitPrice,
      isVerifiedAtPacking: !isAllocated,
    });

    if (earningStatus && deliveredAt) {
      const feeAmount = deliveryFee + handlingFee + packagingCost;
      const netAmount = Math.max(0, totalAmount - feeAmount);
      const claimableAt = new Date(deliveredAt.getTime() + returnWindowDays * DAY_MS);

      if (earningStatus === OrderEarningStatus.READY_TO_CLAIM) readyTotalNet += netAmount;
      if (earningStatus === OrderEarningStatus.PENDING) pendingTotalNet += netAmount;
      if (earningStatus === OrderEarningStatus.CLAIMED) claimedTotalNet += netAmount;
      if (earningStatus === OrderEarningStatus.REFUNDED) refundedTotalNet += netAmount;

      earningRows.push({
        transactionRef: `TXN-${orderId}`,
        merchantId: merchant.id,
        orderId,
        orderNumber: orderId,
        itemSummary: `${catalog.title} (${catalog.variant}) x ${qty}`,
        grossAmount: totalAmount,
        deliveryFee,
        handlingFee,
        packagingFee: packagingCost,
        feeAmount,
        netAmount,
        status: earningStatus,
        returnWindowDays,
        completedAt: deliveredAt,
        claimableAt,
        claimedAt,
        refundedAt: returnedAt,
        refundReason,
        releasedByAdmin: false,
        createdAt: deliveredAt,
        updatedAt: claimedAt ?? returnedAt ?? deliveredAt,
      });
    }
  }

  await prisma.order.createMany({ data: orderRows });
  await prisma.orderItem.createMany({ data: orderItemRows });
  await prisma.orderEarning.createMany({ data: earningRows });

  // Seed 5 Payout Requests (3 PAID with verified Digital Proof + Settlement, 1 ACCEPTED, 1 PENDING)
  interface PayoutSeedSpec {
    requestCode: string;
    amount: number;
    method: PayoutMethod;
    provider: string;
    accountNumber: string;
    branchName?: string;
    routingNumber?: string;
    remarks: string;
    status: PayoutRequestStatus;
    requestedAt: Date;
    reviewedAt?: Date;
    paidAt?: Date;
    trxId?: string;
    channelLabel?: string;
    proofFileExt?: string;
    proofNotes?: string;
  }

  const payoutSpecs: PayoutSeedSpec[] = [
    {
      requestCode: 'PR-TEST-1001',
      amount: 12000,
      method: PayoutMethod.BKASH,
      provider: 'bKash Personal',
      accountNumber: accNumber,
      remarks: 'September/October cycle earnings clearance',
      status: PayoutRequestStatus.PAID,
      requestedAt: new Date(now - 42 * DAY_MS - 4 * HOUR_MS),
      reviewedAt: new Date(now - 42 * DAY_MS - 2 * HOUR_MS),
      paidAt: new Date(now - 42 * DAY_MS),
      trxId: 'BKS91042101',
      channelLabel: 'bKash Corporate Disbursement Confirmation',
      proofNotes: 'Verified payout disbursed to bKash merchant wallet',
    },
    {
      requestCode: 'PR-TEST-1002',
      amount: 10000,
      method: PayoutMethod.NAGAD,
      provider: 'Nagad Personal',
      accountNumber: '01811223344',
      remarks: 'Mid-month wallet settlement request',
      status: PayoutRequestStatus.PAID,
      requestedAt: new Date(now - 24 * DAY_MS - 5 * HOUR_MS),
      reviewedAt: new Date(now - 24 * DAY_MS - 2 * HOUR_MS),
      paidAt: new Date(now - 24 * DAY_MS),
      trxId: 'NGD88421902',
      channelLabel: 'Nagad Corporate Disbursement Confirmation',
      proofNotes: 'Verified Nagad transfer with digital receipt screenshot',
    },
    {
      requestCode: 'PR-TEST-1003',
      amount: 9000,
      method: PayoutMethod.BANK_TRANSFER,
      provider: 'BRAC Bank PLC',
      accountNumber: '1501204892014',
      branchName: 'Banani Branch, Dhaka',
      routingNumber: '060260438',
      remarks: 'BEFTN bank settlement transfer',
      status: PayoutRequestStatus.PAID,
      requestedAt: new Date(now - 10 * DAY_MS - 6 * HOUR_MS),
      reviewedAt: new Date(now - 10 * DAY_MS - 3 * HOUR_MS),
      paidAt: new Date(now - 10 * DAY_MS),
      trxId: 'BRAC20261103',
      channelLabel: 'BEFTN / NPSB Bank Advice Confirmation',
      proofNotes: 'Settled via BRAC Bank BEFTN corporate disbursement',
    },
    {
      requestCode: 'PR-TEST-1004',
      amount: 5000,
      method: PayoutMethod.BKASH,
      provider: 'bKash Personal',
      accountNumber: accNumber,
      remarks: 'Approved payout awaiting Admin digital proof disbursement',
      status: PayoutRequestStatus.ACCEPTED,
      requestedAt: new Date(now - 18 * HOUR_MS),
      reviewedAt: new Date(now - 12 * HOUR_MS),
    },
    {
      requestCode: 'PR-TEST-1005',
      amount: 4000,
      method: PayoutMethod.NAGAD,
      provider: 'Nagad Personal',
      accountNumber: '01811223344',
      remarks: 'Pending payout request for Admin review or Merchant cancel test',
      status: PayoutRequestStatus.PENDING,
      requestedAt: new Date(now - 4 * HOUR_MS),
    },
  ];

  const payoutRequestRows: any[] = [];
  const settlementRows: any[] = [];

  for (const spec of payoutSpecs) {
    let proofDocumentUrl: string | null = null;
    let proofDocumentName: string | null = null;
    let proofDocumentMime: string | null = null;
    let proofChecksum: string | null = null;

    if (spec.status === PayoutRequestStatus.PAID && spec.paidAt && spec.trxId) {
      proofDocumentUrl = buildReceiptSvgDataUrl({
        requestCode: spec.requestCode,
        trxId: spec.trxId,
        merchantName: merchant.businessName,
        merchantCode: merchant.merchantCode,
        channelLabel: spec.channelLabel || `${spec.provider} Disbursement`,
        destinationLabel: `${spec.provider} - ${spec.accountNumber}`,
        amount: spec.amount,
        paidAtIso: spec.paidAt.toISOString(),
      });
      proofDocumentName = `receipt-${spec.trxId.toLowerCase()}.svg`;
      proofDocumentMime = 'image/svg+xml';
      proofChecksum = createHash('sha256')
        .update(
          `${spec.requestCode}|${merchant.id}|${spec.amount.toFixed(2)}|${spec.trxId}|${spec.paidAt.toISOString()}|${proofDocumentUrl.slice(0, 256)}`,
        )
        .digest('hex');
    }

    const createdReq = await prisma.payoutRequest.create({
      data: {
        requestCode: spec.requestCode,
        merchantId: merchant.id,
        amount: spec.amount,
        method: spec.method,
        provider: spec.provider,
        accountNumber: spec.accountNumber,
        accountHolder: accHolder,
        branchName: spec.branchName ?? null,
        routingNumber: spec.routingNumber ?? null,
        remarks: spec.remarks,
        status: spec.status,
        trxId: spec.trxId ?? null,
        proofDocumentUrl,
        proofDocumentName,
        proofDocumentMime,
        proofChannel: spec.channelLabel ?? null,
        proofNotes: spec.proofNotes ?? null,
        proofChecksum,
        requestedAt: spec.requestedAt,
        reviewedAt: spec.reviewedAt ?? null,
        paidAt: spec.paidAt ?? null,
        paidByAdminName: spec.status === PayoutRequestStatus.PAID ? 'Super Admin' : null,
      },
    });
    payoutRequestRows.push(createdReq);

    if (spec.status === PayoutRequestStatus.PAID && spec.paidAt && spec.trxId) {
      const sRow = await prisma.settlement.create({
        data: {
          merchantId: merchant.id,
          payoutRequestId: createdReq.id,
          transactionRef: spec.trxId,
          paymentMethod: spec.method,
          accountDetails: {
            provider: spec.provider,
            accountNumber: spec.accountNumber,
            accountHolder: accHolder,
            ...(spec.branchName ? { branchName: spec.branchName } : {}),
            ...(spec.routingNumber ? { routingNumber: spec.routingNumber } : {}),
          },
          proofDocumentUrl,
          proofDocumentName,
          proofDocumentMime,
          proofChecksum,
          remarks: `Disbursed against Payout Request ${spec.requestCode}`,
          cycleStart: spec.requestedAt,
          cycleEnd: spec.paidAt,
          totalCodCollected: spec.amount,
          storageFees: 0,
          handlingFees: 0,
          packagingFees: 0,
          netPayout: spec.amount,
          isPaid: true,
          paidAt: spec.paidAt,
        },
      });
      settlementRows.push(sRow);
    }
  }

  console.log(
    JSON.stringify(
      {
        seededMerchant: `${merchant.businessName} (${merchant.merchantCode})`,
        ordersInserted: orderRows.length,
        orderBreakdown: {
          READY_TO_CLAIM: 45,
          PENDING_HOLD: 20,
          CLAIMED: 15,
          RETURNED_REFUNDED: 10,
          DISPATCHED: 6,
          ALLOCATED: 4,
        },
        earningsInserted: earningRows.length,
        seededNetTotalsBDT: {
          readyToClaim: readyTotalNet,
          pendingHold: pendingTotalNet,
          claimed: claimedTotalNet,
          refunded: refundedTotalNet,
          paidPayouts: 31000,
          upcomingPayouts: 9000,
          expectedWalletAvailableFromSeeded: claimedTotalNet - 40000,
        },
        payoutRequestsInserted: payoutRequestRows.length,
        settlementsInserted: settlementRows.length,
      },
      null,
      2,
    ),
  );
  console.log('✅ Successfully seeded 100 persistent orders, 90 earnings & 5 payouts for MC-101!');
}

main()
  .catch((err) => {
    console.error('❌ Demo seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
