import { createHash, timingSafeEqual } from 'node:crypto';

import type { NextApiRequest, NextApiResponse } from 'next';

import {
  renderPrintableDirectoryPdf,
  RenderPrintableDirectoryPdfOptions,
} from '@/app/(app)/shared/services/scheduled-pdf-delivery/render-printable-directory-pdf';
import { createLogger } from '@/lib/logger';

/**
 * Renders a printable directory PDF on the server for scheduled PDF delivery
 * (docs/scheduled-pdf-delivery.md).
 *
 * A Pages Router API route on purpose: App Router code (pages, route
 * handlers, server actions, instrumentation, and everything the Payload
 * config reaches) is compiled for React Server Components, where the PDF
 * templates' context and hooks don't exist. Only this app calls it, over
 * loopback, with the internal API key (`requestPrintableDirectoryPdf`).
 */

const log = createLogger('printableDirectoryPdfRoute');

export const config = {
  api: {
    bodyParser: { sizeLimit: '25mb' },
    responseLimit: false,
  },
};

const digest = (value: string) => createHash('sha256').update(value).digest();

function isAuthorized(req: NextApiRequest): boolean {
  const expected = process.env.INTERNAL_API_KEY;
  const received = req.headers['x-internal-api-key'];

  return (
    Boolean(expected) &&
    typeof received === 'string' &&
    timingSafeEqual(digest(received), digest(expected as string))
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  if (!isAuthorized(req)) {
    return res.status(401).end();
  }

  const options = req.body as RenderPrintableDirectoryPdfOptions;
  if (!options?.preview || !options?.print?.locale) {
    return res.status(400).json({ error: 'preview and print are required' });
  }

  try {
    const startedAt = Date.now();
    const bytes = await renderPrintableDirectoryPdf(options);
    log.info(
      { renderMs: Date.now() - startedAt, bytes: bytes.length },
      'Rendered PDF',
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', bytes.length);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(bytes));
  } catch (error) {
    log.error({ err: error }, 'PDF render failed');
    return res.status(500).json({ error: 'render_failed' });
  }
}
