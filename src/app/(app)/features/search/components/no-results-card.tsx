'use client';

import { Phone } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

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
import { getImageUrl } from '@/app/(app)/shared/utils/getImageUrl';

import { DialButton } from './dial-button';

/** `text` replaces the footer message (the v2 weak-match note, which names the way on). */
export function NoResultsCard({ text: textOverride }: { text?: string } = {}) {
  const { t } = useTranslation('page-search');
  const appConfig = useAppConfig();
  const searchParams = useSearchParams();

  const text =
    textOverride ||
    appConfig.search.texts?.noResultsFallbackText ||
    (appConfig?.contact?.number
      ? t('no_results.need_help')
      : t('no_results.alt_subtitle'));

  return (
    <Card data-testid="no-results-card">
      <CardHeader className="text-center">
        <CardTitle>{t('no_results.title')}</CardTitle>
        <CardDescription>
          {searchParams?.get('query_label') || searchParams?.get('query')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <Image
          src={getImageUrl('undraw_searching.svg')}
          width={0}
          height={150}
          alt="Illustration of a person searching"
          style={{ height: '150px', width: 'auto' }}
        />
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-2 text-center">
        <p className="font-semibold">{text}</p>

        {appConfig?.contact?.number && (
          // The one phone path: DialButton goes through getPhoneHref.
          <DialButton
            number={appConfig.contact.number}
            testId="no-results-call"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}
          >
            <Phone className="size-4" /> {appConfig.contact.number}
          </DialButton>
        )}
      </CardFooter>
    </Card>
  );
}
