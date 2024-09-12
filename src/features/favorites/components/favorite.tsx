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
import { cn, getGoogleMapsDestinationUrl } from '@/shared/lib/utils';
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
  const translation = data.translations.find(
    (el) => el.locale === router.locale,
  );
  const coords = useAtomValue(userCoordinatesAtom);
  const address = data.addresses.find(
    (el) => el.rank === 1 && el.type === 'physical',
  );
  const displayAddress = `${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between gap-2">
          <Link
            className="text-primary hover:underline"
            href={`/search/${data._id}`}
          >
            {translation.displayName}
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
        <div className="text-sm">
          {parseHtml(translation.serviceDescription)}
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
      <CardFooter className="flex flex-col gap-2">
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
  );
}
