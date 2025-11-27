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

  const [backUrl, setBackUrl] = useState('loading');

  useEffect(() => {
    if (prevUrl && prevUrl.startsWith('/search')) {
      setBackUrl(prevUrl);
    } else {
      setBackUrl('/');
    }
  }, [prevUrl]);

  return (
    <Button
      variant="outline"
      className="flex gap-1"
      disabled={backUrl === 'loading'}
      onClick={() => {
        if (backUrl === 'loading') return;
        router.push(backUrl);
      }}
    >
      <ChevronLeft className="size-4" />
      {backUrl === '/' ? t('back_to_home') : t('back_to_results')}
    </Button>
  );
}
