'use client';

import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { ReferralButton } from '@/app/(app)/shared/components/referral-button';
import { GetDirectionsButton } from '@/app/(app)/shared/components/get-directions-button';
import { Link } from '@/app/(app)/shared/components/link';
import { cn } from '@/app/(app)/shared/lib/utils';
import { searchCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { useAtomValue } from 'jotai';
import { LinkIcon, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SearchCardComponentProps } from './types';

export function ActionButtonsComponent({ result }: SearchCardComponentProps) {
  const { t } = useTranslation('common');
  const searchCoords = useAtomValue(searchCoordinatesAtom);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        {result.phone ? (
          <ReferralButton
            asChild
            className="flex-1 gap-1 overflow-hidden"
            size="sm"
            referralType="call_referral"
            resourceId={result.id}
            resourceData={result}
            variant="highlight"
          >
            <Link
              href={`tel:${result.phone}`}
              aria-label={`${t('call_to_action.call')} ${result.name}`}
            >
              <Phone className="size-4" />{' '}
              <span className="truncate"> {t('call_to_action.call')} </span>
            </Link>
          </ReferralButton>
        ) : (
          <ReferralButton
            className="flex-1 gap-1 overflow-hidden"
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
            className="flex-1 gap-1 overflow-hidden"
            referralType="website_referral"
            size="sm"
            resourceId={result.id}
            resourceData={result}
            variant="highlight"
          >
            <Link
              href={result.website}
              aria-label={`${t('call_to_action.view_website')} ${result.name}`}
            >
              <LinkIcon className="size-4" />{' '}
              <span className="truncate">{t('call_to_action.view_website')}</span>
            </Link>
          </ReferralButton>
        ) : (
          <ReferralButton
            className="flex-1 gap-1 overflow-hidden"
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
          className="min-h-8 whitespace-normal py-2"
          data={result}
          coords={searchCoords}
        />
      </div>

      <div className="flex w-full items-center gap-2">
        <Link
          className={cn(
            'flex-1 gap-1 text-primary',
            buttonVariants({ variant: 'ghost' }),
          )}
          href={`/search/${result.id}`}
          aria-label={`${t('call_to_action.view_details')}: ${result.name}`}
        >
          {t('call_to_action.view_details')}
        </Link>
      </div>
    </div>
  );
}
