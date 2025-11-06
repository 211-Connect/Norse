import { GetDirectionsButton } from '@/shared/components/get-directions-button';
import { ReferralButton } from '@/shared/components/referral-button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { type Favorite } from '@/shared/store/favorites';
import { Globe, LinkIcon, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import {
  cn,
  distanceBetweenCoordsInKm,
  getGoogleMapsDestinationUrl,
} from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/components/ui/button';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';
import { Badge } from '@/shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { RemoveFromFavoriteListButton } from './remove-from-favorite-list-button';
import { CopyBadge } from '@/shared/components/copy-badge';
import { parseHtml } from '@/shared/lib/parse-html';
import { Separator } from '@/shared/components/ui/separator';
import { Badges } from '@/shared/components/badges';
import { useFlag } from '@/shared/hooks/use-flag';

export function Favorite({
  data,
  viewingAsOwner,
  favoriteListId,
}: {
  data: Favorite;
  viewingAsOwner: boolean;
  favoriteListId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const showServiceName = useFlag('showSearchAndResourceServiceName');
  const translation = data.translations.find(
    (el) => el.locale === router.locale,
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

  console.log('DATA', data);
  console.log('TRANSLATION', translation);

  return (
    <>
      <Card className="flex flex-col gap-3 print:border-none print:shadow-none">
        {labels.length > 0 && (
          <CardHeader>
            <Badges items={labels} />
          </CardHeader>
        )}

        <CardTitle className="mb-0 flex flex-row justify-between gap-2">
          <Link
            className="self-center hover:underline"
            href={`/search/${data._id}`}
          >
            {translation.displayName}
          </Link>

          {viewingAsOwner && (
            <RemoveFromFavoriteListButton
              id={data._id}
              favoriteListId={favoriteListId}
            />
          )}
        </CardTitle>
        {showServiceName && (
          <CardDescription>
            {parseHtml(translation.serviceName)}
          </CardDescription>
        )}
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
            {parseHtml(translation.serviceDescription)}
          </div>

          {translation.taxonomies && translation.taxonomies.length > 0 && (
            <>
              <Separator className="print:hidden" />

              <p className="text-sm font-semibold print:hidden">
                {t('categories_title', { ns: 'page-favorites' })}
              </p>

              <div className="flex flex-col items-start gap-3 print:hidden">
                {translation.taxonomies.map((tax) => (
                  <Badge key={tax.name} variant="default">
                    {tax.name}
                  </Badge>
                ))}
              </div>
            </>
          )}
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
