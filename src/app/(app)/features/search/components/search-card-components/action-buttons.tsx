'use client';

import { useAtomValue } from 'jotai';
import { LinkIcon, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { GetDirectionsButton } from '@/app/(app)/shared/components/get-directions-button';
import { Link } from '@/app/(app)/shared/components/link';
import { ReferralButton } from '@/app/(app)/shared/components/referral-button';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  AnalyticsEvent,
  AnalyticsTools,
  setPendingResourceEntry,
  trackEvent,
} from '@/app/(app)/shared/lib/analytics';
import { cn } from '@/app/(app)/shared/lib/utils';
import { formatPhoneNumber } from '@/app/(app)/shared/utils/phone';
import { searchCoordinatesAtom } from '@/app/(app)/shared/store/search';

import { SearchCardComponentProps } from './types';
import { useResourceCardEntry } from './use-resource-card-entry';

export function ActionButtonsComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation('common');
  const appConfig = useAppConfig();
  const searchCoords = useAtomValue(searchCoordinatesAtom);
  const entry = useResourceCardEntry();
  const viewDetailsText =
    appConfig.search.texts?.viewDetailsText || t('call_to_action.view_details');
  const viewDetailsButtonVariant =
    appConfig.search.texts?.viewDetailsButtonVariant ?? 'ghost';

  return (
    <div className="flex flex-col gap-2 print:hidden">
      <div className="grid w-full grid-cols-1 gap-2 lg:grid-cols-3">
        {result.phone ? (
          // The number is text, not a `tel:` link (Lucas, 2026-11-18): provider numbers never dial.
          <p
            className="flex w-full items-center justify-center gap-1 overflow-hidden rounded-md border px-3 py-1.5 text-sm font-semibold"
            data-testid="provider-phone-text"
          >
            <Phone className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatPhoneNumber(result.phone)}</span>
          </p>
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
            onClick={() =>
              trackEvent(
                AnalyticsEvent.WebsiteButtonClick,
                AnalyticsTools.Matomo,
                {
                  resourceId: String(result.id),
                },
              )
            }
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
            'text-primary flex-1 gap-1',
            buttonVariants({
              variant: viewDetailsButtonVariant,
            }),
          )}
          href={`/search/${result.id}`}
          onClick={() => {
            setPendingResourceEntry(result.id, entry);
            trackEvent(
              AnalyticsEvent.ResourceDetailsClick,
              AnalyticsTools.Matomo,
              {
                resourceId: String(result.id),
                entry,
              },
            );
          }}
          aria-label={`${viewDetailsText}: ${result.name}`}
          prefetch={false}
        >
          {viewDetailsText}
        </Link>
      </div>
    </div>
  );
}
