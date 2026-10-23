import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MemoEngineService } from '../memo-engine/memo-engine.service';

@Processor('jobs.pdf')
export class PdfProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(private readonly memoEngine: MemoEngineService) {
    super();
  }

  async process(job: Job<{ orderId: string; memoCode: string }>): Promise<any> {
    this.logger.log(`Processing invoice PDF generation for order: ${job.data.orderId} (Memo: ${job.data.memoCode})`);

    // Compile invoice data using the MemoEngine
    const compiled = await this.memoEngine.compileInvoice(job.data.orderId);

    // In production, this pipes into a PDF generator (e.g. Puppeteer/PDFKit)
    this.logger.log(`Successfully compiled invoice PDF for order ${job.data.orderId}`);
    return {
      orderId: job.data.orderId,
      memoCode: job.data.memoCode,
      renderedAt: new Date().toISOString(),
      itemCount: compiled.items.length,
    };
  }
}
