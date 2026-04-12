'use client';

import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { useAppConfig } from '../hooks/use-app-config';
import { buttonVariants } from './ui/button';
import { cn } from '../lib/utils';
import { Link } from './link';
import { NEW_TAB_WARNING } from '../lib/constants';

function buildFeedbackHref(
  feedbackUrlValue: string | undefined,
  referringUrl?: string,
) {
  if (!feedbackUrlValue) {
    return null;
  }

  const currentUrl = new URL(feedbackUrlValue);
  const baseUrl = currentUrl.toString().split('?')[0];
  const urlParams = new URLSearchParams(currentUrl.searchParams);

  if (referringUrl) {
    urlParams.set('referring_url', referringUrl);
  }

  return `${baseUrl}?${urlParams.toString()}`;
}

export function ReportButton({
  className,
  customText,
}: {
  className?: string;
  customText?: string;
}) {
  const pathname = usePathname();
  const appConfig = useAppConfig();
  const { t } = useTranslation('page-resource');
  const feedbackUrlValue = appConfig?.contact?.feedbackUrl;
  const linkText = customText || t('report');

  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!feedbackUrlValue) {
      setHref(null);
      return;
    }

    setHref(buildFeedbackHref(feedbackUrlValue, window.location.href));
  }, [feedbackUrlValue, pathname]);

  if (!feedbackUrlValue) {
    return null;
  }

  const finalHref = href ?? feedbackUrlValue;

  return (
    <Link
      href={finalHref}
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
