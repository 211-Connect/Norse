import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { createPageViewEvent } from '../lib/google-tag-manager';

export function PageView() {
  const router = useRouter();
  const rendered = useRef(false);

  // Handle page views and fire event to event hub handlers
  useEffect(() => {
    if (router.isReady && !rendered.current) {
      rendered.current = true;
      createPageViewEvent({
        url: window.location.href,
      });
    }

    const handleRouteChange = (url: string) => {
      createPageViewEvent({ url });
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, router.isReady]);

  return null;
}
