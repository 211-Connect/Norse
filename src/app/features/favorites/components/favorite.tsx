'use client';

import { GetDirectionsButton } from '@/app/shared/components/get-directions-button';
import { ReferralButton } from '@/app/shared/components/referral-button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/shared/components/ui/card';
import { type Favorite } from '@/app/shared/store/favorites';
import { LinkIcon, MapPin, Phone } from 'lucide-react';
import {
  cn,
  distanceBetweenCoordsInKm,
  getGoogleMapsDestinationUrl,
} from '@/app/shared/lib/utils';
import { buttonVariants } from '@/app/shared/components/ui/button';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/app/shared/store/search';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/ui/tooltip';
import { CopyBadge } from '@/app/shared/components/copy-badge';
import { parseHtml } from '@/app/shared/lib/parse-html';
import { Separator } from '@/app/shared/components/ui/separator';
import { Badges } from '@/app/shared/components/badges';
import { Link } from '@/app/shared/components/link';
import { useTranslation } from 'react-i18next';

import { RemoveFromFavoriteListButton } from './remove-from-favorite-list-button';

export function Favorite({
  data,
  viewingAsOwner,
  favoriteListId,
}: {
  data: Favorite;
  viewingAsOwner: boolean;
  favoriteListId: string;
}) {
  const { t, i18n } = useTranslation();
  const translation = data.translations.find(
    (el) => el.locale === i18n.language,
  );
  const coords = useAtomValue(userCoordinatesAtom);
  const address = data.addresses.find(
    (el) => el.rank === 1 && el.type === 'physical',
  );
  const displayAddress = !(
    address?.address_1 &&
    address?.city &&
    address?.stateProvince &&
    address?.postalCode
  )
    ? ''
    : `${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`;

  const distance =
    data?.location?.coordinates && (coords?.length ?? 0) === 2
      ? distanceBetweenCoordsInKm(
          coords as [number, number],
          data.location.coordinates,
        )
      : null;

  const labels = []; // TODO: Add Waiver

  return (
    <>
      <Card className="flex flex-col gap-3 print:border-none print:shadow-none">
        {labels.length > 0 && (
          <CardHeader>
            <Badges items={labels} />
          </CardHeader>
        )}

        <CardTitle className="flex flex-row justify-between gap-2">
          <Link
            className="self-center hover:underline"
            href={`/search/${data._id}`}
          >
            {translation?.displayName}
          </Link>

          {viewingAsOwner && (
            <RemoveFromFavoriteListButton
              id={data._id}
              favoriteListId={favoriteListId}
            />
          )}
        </CardTitle>
        <CardContent className="flex flex-col gap-3">
          {displayAddress ? (
            <div className="flex justify-between gap-3">
              <div className="flex max-w-full items-center gap-1">
                <MapPin className="mt-[2px] size-4 shrink-0 self-start text-primary" />
                <CopyBadge
                  className="max-w-[240px] text-sm font-normal"
                  text={displayAddress}
                  href={getGoogleMapsDestinationUrl(
                    coords,
                    data?.location?.coordinates,
                  )}
                >
                  {displayAddress}
                </CopyBadge>
              </div>
              {distance !== null && (
                <p className="whitespace-nowrap text-sm">{`${distance.toFixed(1)} ${t('search.miles_short', { ns: 'common' })}`}</p>
              )}
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="w-fit">
                  <div className="flex max-w-full items-center gap-1">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <p className="truncate text-sm font-normal">
                      {t('search.address_unavailable')}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-64" side="right">
                  <p>{t('search.confidential_address')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {data.displayPhoneNumber && (
            <div className="flex max-w-full items-center gap-1">
              <Phone className="size-4 shrink-0 text-primary" />
              <CopyBadge
                className="text-sm font-normal"
                text={data.displayPhoneNumber}
                href={`tel:${data.displayPhoneNumber}`}
              >
                {data.displayPhoneNumber}
              </CopyBadge>
            </div>
          )}

          {data.website && (
            <div className="flex max-w-full items-center gap-1">
              <LinkIcon className="size-4 shrink-0 text-primary" />
              <CopyBadge
                className="text-sm font-normal"
                href={data.website}
                text={data.website}
                target="_blank"
                truncate
              >
                {data.website}
              </CopyBadge>
            </div>
          )}

          <div className="whitespace-break-spaces text-sm">
            {parseHtml(translation?.serviceDescription ?? '')}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 print:hidden">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <ReferralButton
              className="flex-1 gap-1"
              size="sm"
              disabled={!data.displayPhoneNumber}
              referralType="call_referral"
              resourceId={data._id}
              resourceData={data}
              variant="highlight"
              onClick={() => {
                window.open(`tel:${data.displayPhoneNumber}`);
              }}
            >
              <Phone className="size-4" /> {t('call_to_action.call')}
            </ReferralButton>

            <ReferralButton
              className="flex-1 gap-1"
              referralType="website_referral"
              size="sm"
              resourceId={data._id}
              resourceData={data}
              disabled={!data.website}
              variant="highlight"
              onClick={() => {
                window.open(data.website, '_blank');
              }}
            >
              <LinkIcon className="size-4" /> {t('call_to_action.view_website')}
            </ReferralButton>

            <GetDirectionsButton data={data} coords={coords} />
          </div>
          <div className="flex w-full items-center gap-2">
            <Link
              className={cn(
                'flex-1 gap-1 text-primary',
                buttonVariants({ variant: 'ghost' }),
              )}
              href={`/search/${data._id}`}
            >
              {t('call_to_action.view_details')}
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
