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
          <Phone className="size-4" />{' '}
          <span className="truncate"> {t('call_to_action.call')} </span>
        </ReferralButton>

        <ReferralButton
          className="flex-1 gap-1 overflow-hidden"
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
          <LinkIcon className="size-4" />{' '}
          <span className="truncate">{t('call_to_action.view_website')}</span>
        </ReferralButton>

        <GetDirectionsButton
          className="overflow-hidden"
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
        >
          {t('call_to_action.view_details')}
        </Link>
      </div>
    </div>
  );
}
