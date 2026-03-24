'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { usePrevUrl } from '@/app/(app)/shared/hooks/use-prev-url';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function BackToResultsButton() {
  const router = useRouter();
  const prevUrl = usePrevUrl();
  const { t } = useTranslation('page-resource');

  const [backUrl, setBackUrl] = useState<string>('loading');
  const [useHistory, setUseHistory] = useState(false);

  useEffect(() => {
    // Regex to match search pages: /search or /search?... (with any locale prefix)
    const searchPagePattern = /\/search(\?|$)/;

    // First, check if prevUrl from context is a search page
    if (prevUrl && searchPagePattern.test(prevUrl)) {
      setBackUrl(prevUrl);
      setUseHistory(false);
      return;
    }

    // Fallback: check if user came from a search page using document.referrer
    if (typeof window !== 'undefined' && document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);
        const referrerPath = referrerUrl.pathname + referrerUrl.search;

        if (
          referrerUrl.origin === window.location.origin &&
          searchPagePattern.test(referrerPath)
        ) {
          setBackUrl(referrerPath);
          setUseHistory(false);
          return;
        }
      } catch {
        // Invalid referrer URL, continue to fallback
      }
    }

    // Last resort: try browser history if available
    if (typeof window !== 'undefined' && window.history.length > 1) {
      setBackUrl('history');
      setUseHistory(true);
    } else {
      // Final fallback: go to home
      setBackUrl('/');
      setUseHistory(false);
    }
  }, [prevUrl]);

  const handleClick = () => {
    if (backUrl === 'loading') return;

    if (useHistory) {
      router.back();
    } else {
      router.push(backUrl);
    }
  };

  return (
    <Button
      variant="outline"
      className="flex gap-1"
      disabled={backUrl === 'loading'}
      onClick={handleClick}
    >
      <ChevronLeft className="size-4" />
      {backUrl === '/' || useHistory ? t('back_to_home') : t('back_to_results')}
    </Button>
  );
}
