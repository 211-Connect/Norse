'use client';

import {
  Button,
  buttonVariants,
} from '@/app/(app)/shared/components/ui/button';
import { usePrevUrl } from '@/app/(app)/shared/hooks/use-prev-url';
import { createLinkEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { cn } from '@/app/(app)/shared/lib/utils';
import { ChevronLeft } from 'lucide-react';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function BackToResultsButton() {
  const prevUrl = usePrevUrl();
  const { t } = useTranslation('page-resource');

  const [backUrl, setBackUrl] = useState<string | 'loading'>('loading');

  useEffect(() => {
    if (prevUrl && /\/search\/?(\?|$)/.test(prevUrl)) {
      setBackUrl(prevUrl);
    } else {
      setBackUrl('/');
    }
  }, [prevUrl]);

  if (backUrl === 'loading') {
    return (
      <Button variant="outline" className="flex gap-1" disabled>
        <ChevronLeft aria-hidden="true" className="size-4" />
        {t('back_to_results')}
      </Button>
    );
  }

  return (
    <NextLink
      className={cn(buttonVariants({ variant: 'outline' }), 'flex gap-1')}
      href={backUrl}
      onClick={createLinkEvent}
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      {backUrl === '/' ? t('back_to_home') : t('back_to_results')}
    </NextLink>
  );
}
