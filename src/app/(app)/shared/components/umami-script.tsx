'use client';

import Script from 'next/script';

import { flushPendingUmamiEvents } from '@/app/(app)/shared/lib/umami';

export function UmamiScript({
  scriptUrl,
  websiteId,
  nonce,
}: {
  scriptUrl?: string;
  websiteId?: string;
  nonce?: string;
}) {
  if (!scriptUrl || !websiteId) return null;

  return (
    <Script
      id="umami-script"
      src={scriptUrl}
      data-website-id={websiteId}
      nonce={nonce}
      onLoad={flushPendingUmamiEvents}
    />
  );
}
