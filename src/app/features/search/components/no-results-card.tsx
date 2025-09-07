'use client';

import { LocalizedLink } from '@/app/shared/components/LocalizedLink';
import { buttonVariants } from '@/app/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { useAppConfig } from '@/app/shared/hooks/use-app-config';
import { cn } from '@/app/shared/lib/utils';
import { Phone } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function NoResultsCard({ showAltSubtitle }) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const searchParams = useSearchParams();

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('no_results.title')}</CardTitle>
        <CardDescription>
          {searchParams.get('query_label') || searchParams.get('query')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src="/images/undraw_searching.svg"
          width={0}
          height={150}
          alt="Illustration of a person searching"
          style={{ height: '150px', width: 'auto' }}
        />
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-2">
        <p className="font-semibold">
          {!showAltSubtitle
            ? t('no_results.subtitle')
            : appConfig?.contact?.number
              ? t('no_results.need_help')
              : t('search.no_results_fallback_text', {
                  ns: 'dynamic',
                  defaultValue: t('no_results.alt_subtitle'),
                })}
        </p>

        {appConfig?.contact?.number && (
          <LocalizedLink
            href={`tel:${appConfig.contact.number}`}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
          >
            <Phone className="size-4" /> {appConfig.contact.number}
          </LocalizedLink>
        )}
      </CardFooter>
    </Card>
  );
}
