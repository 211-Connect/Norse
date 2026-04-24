import { redirect, notFound } from 'next/navigation';
import { expandShortUrl } from '@/app/(app)/shared/serverActions/shortUrl/expandShortUrl';
import { createLogger } from '@/lib/logger';

interface SharePageProps {
  params: Promise<{ locale: string; shortCode: string }>;
}

const log = createLogger('SharePage');

export default async function SharePage({ params }: SharePageProps) {
  const { shortCode } = await params;

  if (!shortCode) {
    notFound();
  }

  let url: string | null = null;

  try {
    url = await expandShortUrl(shortCode);
    log.debug({ shortCode, url }, 'Expanded short code');
  } catch (error) {
    log.error({ shortCode, error }, 'Failed to expand short code');
    notFound();
  }

  if (!url) {
    log.debug({ shortCode }, 'No URL found for short code');
    notFound();
  }

  log.debug({ shortCode, url }, 'Redirecting to URL');
  redirect(url);
}
