'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

import { flushPendingUmamiEvents } from '@/app/(app)/shared/lib/analytics';

import { getFingerprint } from './thumbmark-fingerprint';

type UmamiPayload = Record<string, unknown>;

let landingPage: { url: string; referrer: string } | undefined;
let sawFirstPageview = false;
let identified = false;

async function sendWithFingerprint(type: string, payload: UmamiPayload) {
  let currentPage: UmamiPayload | undefined;

  if (type === 'event' && !payload.name && !sawFirstPageview) {
    sawFirstPageview = true;
    if (landingPage && payload.url !== landingPage.url) {
      // The visitor navigated before the tracker loaded. Record both pages.
      currentPage = { ...payload, referrer: landingPage.url };
      payload = { ...payload, ...landingPage };
    }
  }

  const fingerprint = await getFingerprint();
  if (!fingerprint) return undefined;

  if (type !== 'identify' && !identified && window.umami) {
    identified = true;
    void window.umami.identify(fingerprint);
  }
  if (currentPage) {
    const page = currentPage;
    // Let the landing-page request start before the replayed current page.
    window.setTimeout(() => window.umami?.track(page), 0);
  }
  return { ...payload, id: fingerprint };
}

export function UmamiScript({
  scriptUrl,
  websiteId,
  nonce,
}: {
  scriptUrl?: string;
  websiteId?: string;
  nonce?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scriptUrl || !websiteId) return;
    landingPage ??= {
      url: window.location.href,
      referrer: document.referrer,
    };
    window.norseUmamiBeforeSend = sendWithFingerprint;
    setReady(true);
  }, [scriptUrl, websiteId]);

  if (!scriptUrl || !websiteId || !ready) return null;

  return (
    <Script
      id="umami-script"
      src={scriptUrl}
      data-website-id={websiteId}
      data-before-send="norseUmamiBeforeSend"
      nonce={nonce}
      onReady={flushPendingUmamiEvents}
    />
  );
}
