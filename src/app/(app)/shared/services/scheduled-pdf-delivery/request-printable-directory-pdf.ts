import { getNormalizedCustomBasePath } from '@/app/(app)/shared/lib/utils';

import type { RenderPrintableDirectoryPdfOptions } from './render-printable-directory-pdf';

/**
 * This app's own origin as seen from inside the server process. Next sets
 * `PORT` for both `next dev` and the standalone server; `INTERNAL_APP_URL`
 * overrides it when loopback on that port isn't right.
 */
function getInternalOrigin(): string {
  return (
    process.env.INTERNAL_APP_URL?.replace(/\/+$/, '') ||
    `http://127.0.0.1:${process.env.PORT || 3000}`
  );
}

/**
 * Renders a printable directory PDF through the internal Pages API route
 * (`src/pages/api/internal/printable-directory-pdf.ts`), which, unlike App
 * Router and Payload code, isn't compiled for React Server Components.
 */
export async function requestPrintableDirectoryPdf(
  options: RenderPrintableDirectoryPdfOptions,
): Promise<Uint8Array> {
  const internalApiKey = process.env.INTERNAL_API_KEY;
  if (!internalApiKey) {
    throw new Error('INTERNAL_API_KEY is not configured');
  }

  const response = await fetch(
    `${getInternalOrigin()}${getNormalizedCustomBasePath()}/api/internal/printable-directory-pdf`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalApiKey,
      },
      body: JSON.stringify(options),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    throw new Error(`PDF render request failed with ${response.status}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}
