'use client';

import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Phone } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export function NoResultsCard({ showAltSubtitle }) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const searchParams = useSearchParams();

  const imageUrl = `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/images/undraw_searching.svg`;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t('no_results.title')}</CardTitle>
        <CardDescription>
          {searchParams?.get('query_label') || searchParams?.get('query')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src={imageUrl}
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
              : appConfig.search.texts?.noResultsFallbackText ||
                t('no_results.alt_subtitle')}
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
