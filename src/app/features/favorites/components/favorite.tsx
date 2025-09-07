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
import { Globe, LinkIcon, MapPin, Phone } from 'lucide-react';
import { cn, getGoogleMapsDestinationUrl } from '@/app/shared/lib/utils';
import { buttonVariants } from '@/app/shared/components/ui/button';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/app/shared/store/search';
import { Badge } from '@/app/shared/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/shared/components/ui/tooltip';
import { CopyBadge } from '@/app/shared/components/copy-badge';
import { parseHtml } from '@/app/shared/lib/parse-html';
import { Separator } from '@/app/shared/components/ui/separator';
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

  return (
    <>
      <Card className="print:border-none print:shadow-none">
        <CardHeader>
          <CardTitle className="flex flex-row justify-between gap-2">
            <Link
              className="text-primary hover:underline"
              href={`/search/${data._id}`}
            >
              {translation?.displayName}
            </Link>

            <div>
              {viewingAsOwner && (
                <RemoveFromFavoriteListButton
                  id={data._id}
                  favoriteListId={favoriteListId}
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="whitespace-break-spaces">
            {parseHtml(translation?.serviceDescription ?? '')}
          </div>

          <div className="flex flex-col items-start justify-start gap-2">
            {data.displayPhoneNumber && (
              <div className="flex max-w-full items-center gap-1 text-primary/80">
                <Phone className="size-4 shrink-0" />
                <CopyBadge
                  text={data.displayPhoneNumber}
                  href={`tel:${data.displayPhoneNumber}`}
                >
                  {data.displayPhoneNumber}
                </CopyBadge>
              </div>
            )}

            {displayAddress ? (
              <div className="flex max-w-full items-center gap-1 text-primary/80">
                <MapPin className="size-4 shrink-0" />
                <CopyBadge
                  text={displayAddress}
                  href={getGoogleMapsDestinationUrl(
                    coords,
                    data?.location?.coordinates,
                  )}
                >
                  {displayAddress}
                </CopyBadge>
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="max-w-full">
                      <p className="truncate">
                        {t('search.address_unavailable')}
                      </p>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64" side="right">
                    <p>{t('search.confidential_address')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {data.website && (
              <div className="flex max-w-full items-center gap-1 text-primary/80">
                <Globe className="size-4 shrink-0" />
                <CopyBadge href={data.website} text={data.website}>
                  <p className="truncate">{data.website}</p>
                </CopyBadge>
              </div>
            )}
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
              <Globe className="size-4" /> {t('call_to_action.view_website')}
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
              <LinkIcon className="size-4" /> {t('call_to_action.view_details')}
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Separator className="hidden border-b border-black print:block" />
    </>
  );
}
