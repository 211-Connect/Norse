'use client';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { usePrevUrl } from '@/app/(app)/shared/hooks/use-prev-url';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function BackToResultsButton() {
  const router = useRouter();
  const prevUrl = usePrevUrl();
  const { t } = useTranslation('page-resource');

  const isSearchPage = prevUrl?.includes('/search');

  const handleClick = () => {
    if (isSearchPage && prevUrl) {
      router.push(prevUrl);
    } else {
      router.back();
    }
  };

  return (
    <Button variant="outline" className="flex gap-1" onClick={handleClick}>
      <ChevronLeft className="size-4" />
      {isSearchPage ? t('back_to_results') : t('back_to_home')}
    </Button>
  );
}
