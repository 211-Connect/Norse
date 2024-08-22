import { Button } from '@/shared/components/ui/button';
import { usePrevUrl } from '@/shared/hooks/use-prev-url';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function BackToResultsButton() {
  const [backUrl, setBackUrl] = useState('loading');
  const router = useRouter();
  const { t } = useTranslation('page-resource');
  const prevUrl = usePrevUrl();

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
