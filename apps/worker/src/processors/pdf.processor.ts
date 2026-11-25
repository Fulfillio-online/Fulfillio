import { Job } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { getPrismaClient } from '../db/prisma.client';
import { workerConfig } from '../config/worker.config';
import { compileInvoiceHtml, InvoiceTemplateData } from '../templates/invoice.html';
import { MemoPaperSize, MemoTemplateLayout } from '@fulfillio/shared';

export interface PdfJobData {
  orderId: string;
  memoCode?: string;
}

// Shared Chromium browser manager to avoid launching a new browser per PDF job
let sharedBrowser: any = null;
let browserLaunchPromise: Promise<any> | null = null;
let activePages = 0;
let jobsProcessedWithCurrentBrowser = 0;
let idleTimer: NodeJS.Timeout | null = null;

function clearIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

export async function closeSharedBrowser() {
  clearIdleTimer();
  const browserToClose = sharedBrowser;
  sharedBrowser = null;
  jobsProcessedWithCurrentBrowser = 0;
  if (browserToClose) {
    try {
      await browserToClose.close();
      console.log('[Worker - PDF] Shared Chromium browser closed cleanly.');
    } catch (err: any) {
      console.warn(`[Worker - PDF] Error closing shared browser: ${err?.message}`);
    }
  }
}

function scheduleIdleClose() {
  clearIdleTimer();
  idleTimer = setTimeout(() => {
    if (activePages === 0 && sharedBrowser) {
      console.log('[Worker - PDF] Browser idle timeout reached. Closing Chromium to free RAM.');
      void closeSharedBrowser();
    }
  }, workerConfig.pdf.idleTimeoutMs);
  if (typeof idleTimer.unref === 'function') {
    idleTimer.unref();
  }
}

async function getSharedBrowser(puppeteer: any) {
  clearIdleTimer();

  if (sharedBrowser && sharedBrowser.isConnected()) {
    return sharedBrowser;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = (async () => {
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
      ],
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    const browser = await puppeteer.launch(launchOptions);
    browser.on('disconnected', () => {
      if (sharedBrowser === browser) {
        sharedBrowser = null;
        jobsProcessedWithCurrentBrowser = 0;
      }
    });

    sharedBrowser = browser;
    jobsProcessedWithCurrentBrowser = 0;
    console.log('[Worker - PDF] Launched shared Chromium browser instance.');
    return browser;
  })();

  try {
    return await browserLaunchPromise;
  } finally {
    browserLaunchPromise = null;
  }
}

export async function processPdfJob(job: Job<PdfJobData>) {
  const { orderId, memoCode } = job.data;
  console.log(`[Worker - PDF] Processing invoice render for Order ID: ${orderId} (Memo: ${memoCode || 'default'})`);

  const prisma = getPrismaClient();

  // 1. Fetch Order with Items and Merchant
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      merchant: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found in database.`);
  }

  // 2. Resolve Memo Template
  let templateLayout: MemoTemplateLayout | null = null;
  const targetMemoCode = memoCode || order.memoCode || 'MEMO-DEFAULT';

  const memoRecord = await prisma.memoTemplate.findFirst({
    where: {
      merchantId: order.merchantId,
      memoCode: targetMemoCode,
    },
  });

  if (memoRecord && memoRecord.layout) {
    templateLayout = memoRecord.layout as unknown as MemoTemplateLayout;
  } else {
    // Fallback default
    templateLayout = {
      header: {
        showLogo: false,
        storeName: order.merchant.businessName,
        phone: order.merchant.phone || undefined,
        address: order.merchant.location || undefined,
        brandColor: '#1e3a8a',
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
        thankYouMessage: 'Thank you for your business!',
        terms: 'Return accepted within 7 days with original packaging.',
      },
      paperSize: MemoPaperSize.A4,
    };
  }

  // 3. Compile Template Data
  const templateData: InvoiceTemplateData = {
    orderId: order.id,
    memoCode: targetMemoCode,
    template: templateLayout,
    merchant: {
      name: order.merchant.businessName,
      phone: order.merchant.phone || undefined,
      address: order.merchant.location || undefined,
    },
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.customerAddress,
      city: order.city || undefined,
    },
    items: (order.items || []).map((item: any) => ({
      productTitle: item.variant?.product?.title || 'Unknown Product',
      sku: item.variant?.sku || 'SKU-UNKNOWN',
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      total: Number(item.unitPrice) * item.quantity,
    })),
    financials: {
      totalAmount: Number(order.totalAmount),
      codAmount: Number(order.codAmount),
      packagingCost: Number(order.packagingCost),
    },
    courier: {
      provider: order.courierProvider || undefined,
      trackingCode: order.trackingCode || undefined,
      consignmentId: order.consignmentId || undefined,
    },
    compiledAt: new Date().toISOString(),
  };

  const htmlContent = compileInvoiceHtml(templateData);

  // 4. Output Directory
  const outDir = path.resolve(process.cwd(), workerConfig.storage.invoicesDir);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfFileName = `invoice-${order.id}.pdf`;
  const pdfFilePath = path.join(outDir, pdfFileName);
  let renderEngine = 'puppeteer';

  // 5. Render via Puppeteer (with fallback to HTML storage if chromium is uninstalled)
  try {
    let puppeteer: any;
    try {
      // Dynamic import so lack of local chromium does not fail build
      puppeteer = await (Function('return import("puppeteer")')());
    } catch {
      puppeteer = null;
    }

    if (!puppeteer) {
      throw new Error('Puppeteer package not installed or binary missing');
    }

    const browser = await getSharedBrowser(puppeteer);
    let page: any = null;
    activePages += 1;

    try {
      page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const isThermal =
        templateLayout.paperSize === MemoPaperSize.THERMAL_4X6 ||
        templateLayout.paperSize === MemoPaperSize.POS_80MM;

      await page.pdf({
        path: pdfFilePath,
        printBackground: true,
        width: isThermal ? '4in' : undefined,
        height: isThermal ? '6in' : undefined,
        format: isThermal ? undefined : templateLayout.paperSize === MemoPaperSize.A5 ? 'A5' : 'A4',
        margin: isThermal
          ? { top: '2mm', bottom: '2mm', left: '2mm', right: '2mm' }
          : { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
      });
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
      activePages = Math.max(0, activePages - 1);
      jobsProcessedWithCurrentBrowser += 1;

      if (activePages === 0) {
        if (jobsProcessedWithCurrentBrowser >= workerConfig.pdf.maxJobsPerBrowser) {
          console.log(
            `[Worker - PDF] Reached ${jobsProcessedWithCurrentBrowser} PDFs on current Chromium. Recycling browser to prevent memory leaks.`,
          );
          await closeSharedBrowser();
        } else {
          scheduleIdleClose();
        }
      }
    }
  } catch (err: any) {
    console.warn(`[Worker - PDF] Puppeteer render failed, falling back to printable HTML: ${err.message}`);
    renderEngine = 'html-fallback';
    const htmlFilePath = path.join(outDir, `invoice-${order.id}.html`);
    fs.writeFileSync(htmlFilePath, htmlContent, 'utf-8');
  }

  // 6. Update Order Status in Database
  await prisma.order.update({
    where: { id: order.id },
    data: {
      isMemoPrinted: true,
      memoPrintedAt: new Date(),
    },
  });

  console.log(`[Worker - PDF] Successfully generated invoice (${renderEngine}) for order ${order.id}`);

  return {
    success: true,
    orderId: order.id,
    fileName: pdfFileName,
    filePath: pdfFilePath,
    engine: renderEngine,
    timestamp: new Date().toISOString(),
  };
}
