'use client';

import { useAtomValue } from 'jotai';
import { LinkIcon, Phone } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { GetDirectionsButton } from '@/app/(app)/shared/components/get-directions-button';
import { Link } from '@/app/(app)/shared/components/link';
import { ReferralButton } from '@/app/(app)/shared/components/referral-button';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { ResourceEntry } from '@/app/(app)/shared/lib/umami';
import { cn } from '@/app/(app)/shared/lib/utils';
import { searchCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { SearchCardComponentProps } from './types';

export function ActionButtonsComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation('common');
  const appConfig = useAppConfig();
  const searchCoords = useAtomValue(searchCoordinatesAtom);
  const searchParams = useSearchParams();
  const entry = searchParams.get('entry') ?? ResourceEntry.SearchCard;
  const viewDetailsText =
    appConfig.search.texts?.viewDetailsText || t('call_to_action.view_details');
  const useTextLinkForViewDetails =
    appConfig.search.texts?.useTextLinkForViewDetails ?? false;

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-3">
        {result.phone ? (
          <ReferralButton
            asChild
            className="w-full gap-1 overflow-hidden"
            size="sm"
            referralType="call_referral"
            resourceId={result.id}
            resourceData={result}
            variant="highlight"
          >
            <Link
              href={`tel:${result.phone}`}
              aria-label={`${t('call_to_action.call')} ${result.name}`}
              prefetch={false}
            >
              <Phone className="size-4" />{' '}
              <span className="truncate"> {t('call_to_action.call')} </span>
            </Link>
          </ReferralButton>
        ) : (
          <ReferralButton
            className="w-full gap-1 overflow-hidden"
            size="sm"
            disabled
            referralType="call_referral"
            resourceId={result.id}
            resourceData={result}
            variant="highlight"
          >
            <Phone className="size-4" />{' '}
            <span className="truncate"> {t('call_to_action.call')} </span>
          </ReferralButton>
        )}

        {result.website ? (
          <ReferralButton
            asChild
            className="w-full gap-1 overflow-hidden"
            referralType="website_referral"
            size="sm"
            resourceId={result.id}
            resourceData={result}
            variant="highlight"
          >
            <Link
              href={result.website}
              aria-label={`${t('call_to_action.view_website')} ${result.name}`}
              prefetch={false}
            >
              <LinkIcon className="size-4" />{' '}
              <span className="truncate">
                {t('call_to_action.view_website')}
              </span>
            </Link>
          </ReferralButton>
        ) : (
          <ReferralButton
            className="w-full gap-1 overflow-hidden"
            referralType="website_referral"
            size="sm"
            resourceId={result.id}
            resourceData={result}
            disabled
            variant="highlight"
          >
            <LinkIcon className="size-4" />{' '}
            <span className="truncate">{t('call_to_action.view_website')}</span>
          </ReferralButton>
        )}

        <GetDirectionsButton
          className="min-h-8 py-2 whitespace-normal"
          data={result}
          coords={searchCoords}
        />
      </div>

      <div className="flex w-full items-center gap-2">
        <Link
          className={cn(
            useTextLinkForViewDetails
              ? 'text-primary hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex min-h-8 flex-1 items-center justify-center rounded-md px-3 py-2 text-center underline decoration-1 underline-offset-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              : cn(
                  'text-primary flex-1 gap-1',
                  buttonVariants({ variant: 'ghost' }),
                ),
          )}
          href={`/search/${result.id}?entry=${entry}`}
          aria-label={`${viewDetailsText}: ${result.name}`}
        >
          {viewDetailsText}
        </Link>
      </div>
    </div>
  );
}
