import type { TaskConfig } from 'payload';

import {
  DELIVERY_HOUR,
  getDeliveryClock,
} from '@/app/(app)/features/printable-directories/utils/deliveryClock';
import { createLogger } from '@/lib/logger';

const log = createLogger('deliverScheduledPdfs');

const EMPTY_OUTPUT = {
  ran: false,
  tenants: 0,
  due: 0,
  sent: 0,
  sentAsLink: 0,
  skipped: 0,
  failed: 0,
};

/**
 * Emails scheduled printable directory PDFs (docs/scheduled-pdf-delivery.md).
 *
 * Payload's scheduler has no time zone setting and the server runs in UTC,
 * so the task is scheduled hourly and only does work at 03:00
 * America/New_York, which stays correct across DST. Queue it with
 * `{ date: 'YYYY-MM-DD', force: true }` to run (or re-run) a day by hand;
 * the API's per-day claim prevents duplicate emails.
 */
export const deliverScheduledPdfs: TaskConfig<'deliverScheduledPdfs'> = {
  slug: 'deliverScheduledPdfs',
  retries: 0,
  schedule: [
    {
      cron: '0 * * * *',
      queue: 'pdfDelivery',
    },
  ],
  inputSchema: [
    { name: 'date', type: 'text' },
    { name: 'force', type: 'checkbox' },
  ],
  outputSchema: [
    { name: 'ran', type: 'checkbox', required: true },
    { name: 'tenants', type: 'number', required: true },
    { name: 'due', type: 'number', required: true },
    { name: 'sent', type: 'number', required: true },
    { name: 'sentAsLink', type: 'number', required: true },
    { name: 'skipped', type: 'number', required: true },
    { name: 'failed', type: 'number', required: true },
  ],
  handler: async ({ input, req }) => {
    const clock = getDeliveryClock();

    if (!input?.force && clock.hour !== DELIVERY_HOUR) {
      return { output: EMPTY_OUTPUT };
    }

    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.SENDGRID_API_KEY
    ) {
      log.warn('SENDGRID_API_KEY is not set; skipping scheduled PDF delivery');
      return { output: EMPTY_OUTPUT };
    }

    const date = input?.date || clock.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date "${date}"`);
    }

    log.info({ date }, 'Starting scheduled PDF delivery');

    // Loaded lazily so the Payload config (also read by the Payload CLI)
    // doesn't import the PDF renderer.
    const { runScheduledPdfDeliveries } =
      await import('@/app/(app)/shared/services/scheduled-pdf-delivery/run-scheduled-pdf-deliveries');
    const stats = await runScheduledPdfDeliveries(req.payload, date);

    return { output: { ran: true, ...stats } };
  },
};
