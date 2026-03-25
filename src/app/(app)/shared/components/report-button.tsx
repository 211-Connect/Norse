'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

import { useAppConfig } from '../hooks/use-app-config';
import { buttonVariants } from './ui/button';
import { cn } from '../lib/utils';
import { Link } from './link';
import { NEW_TAB_WARNING } from '../lib/constants';

export function ReportButton({
  className,
  customText,
}: {
  className?: string;
  customText?: string;
}) {
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');
  const pathname = usePathname();
  const feedbackUrlValue = appConfig?.contact?.feedbackUrl;
  const linkText = customText || t('report');

  const href = useMemo(() => {
    if (!feedbackUrlValue) {
      return null;
    }

    const currentUrl = new URL(feedbackUrlValue);
    const baseUrl = currentUrl.toString().split('?')[0];
    const urlParams = new URLSearchParams(currentUrl.searchParams);

    if (typeof window !== 'undefined') {
      urlParams.set('referring_url', window.location.href);
    }

    return `${baseUrl}?${urlParams.toString()}`;
  }, [feedbackUrlValue, pathname]);

  if (!feedbackUrlValue) {
    return null;
  }

  return (
    <Link
      href={href ?? feedbackUrlValue ?? '#'}
      target="_blank"
      aria-label={`${linkText}${NEW_TAB_WARNING}`}
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'flex gap-1',
        className,
      )}
    >
      <TriangleAlert className="size-4" aria-hidden="true" />
      {linkText}
    </Link>
  );
}
