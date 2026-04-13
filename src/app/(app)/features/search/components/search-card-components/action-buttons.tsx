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
        <ReferralButton
          className="flex-1 gap-1 overflow-hidden"
          size="sm"
          disabled={!result.phone}
          referralType="call_referral"
          resourceId={result.id}
          resourceData={result}
          variant="highlight"
          onClick={() => {
            window.open(`tel:${result.phone}`);
          }}
        >
          <Phone aria-hidden="true" className="size-4" />{' '}
          <span className="truncate"> {t('call_to_action.call')} </span>
        </ReferralButton>

        <ReferralButton
          className="min-h-8 flex-1 gap-1 whitespace-normal py-2"
          referralType="website_referral"
          size="sm"
          resourceId={result.id}
          resourceData={result}
          disabled={!result.website}
          variant="highlight"
          onClick={() => {
            window.open(result.website, '_blank');
          }}
        >
          <LinkIcon aria-hidden="true" className="size-4 shrink-0" />{' '}
          <span className="text-center leading-tight">
            {t('call_to_action.view_website')}
          </span>
        </ReferralButton>

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
