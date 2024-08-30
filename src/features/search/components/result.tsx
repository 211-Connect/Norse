import { buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Link } from '@/shared/components/link';
import { cn, distanceBetweenCoordsInMiles } from '@/shared/lib/utils';
import { ResultType } from '@/shared/store/results';
import { Globe, LinkIcon, MapPin, Navigation, Phone, Pin } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { Badge } from '@/shared/components/ui/badge';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';
import { Separator } from '@/shared/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { GetDirectionsButton } from '../../../shared/components/get-directions-button';
import { ReferralButton } from '@/shared/components/referral-button';
import { AddToFavoritesButton } from '@/shared/components/add-to-favorites-button';
import { CopyBadge } from '@/shared/components/copy-badge';
import { parseHtml } from '@/shared/lib/parse-html';

type ResultProps = {
  data: ResultType;
};

export function Result({ data }: ResultProps) {
  const { t } = useTranslation();
  const coords = useAtomValue(userCoordinatesAtom);

  const distance =
    data?.location?.coordinates && (coords?.length ?? 0) === 2
      ? distanceBetweenCoordsInMiles(
          coords as [number, number],
          data.location.coordinates,
        )
      : false;

  return (
    <Card id={data._id}>
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex items-center justify-start">
            {data.priority === 1 && (
              <Badge variant="outline" className="flex gap-1">
                <Pin className="size-3" />
                Pinned
              </Badge>
            )}
          </div>

          <div>
            {distance && distance > 0 && (
              <Badge variant="outline" className="flex gap-1">
                <Navigation className="size-3" />
                {distance.toLocaleString()} {t('search.miles')}
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="flex flex-row justify-between gap-2">
          <Link
            className="self-center text-primary hover:underline"
            href={`/search/${data.id}`}
          >
            {data.name}
          </Link>

          <div>
            <AddToFavoritesButton size="icon" serviceAtLocationId={data.id} />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="text-sm">{parseHtml(data.description)}</div>

        <div className="flex flex-col items-start justify-start gap-2">
          {data.phone && (
            <div className="flex max-w-full items-center gap-1 text-primary/80">
              <Phone className="size-4 shrink-0" />
              <CopyBadge text={data.phone} href={`tel:${data.phone}`}>
                {data.phone}
              </CopyBadge>
            </div>
          )}

          {data.address ? (
            <div className="flex max-w-full items-center gap-1 text-primary/80">
              <MapPin className="size-4 shrink-0" />
              <CopyBadge text={data.address}>{data.address}</CopyBadge>
            </div>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex max-w-full items-center gap-1">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <p className="truncate text-xs font-semibold">
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

          {data.website && (
            <div className="flex max-w-full items-center gap-1 text-primary/80">
              <Globe className="size-4 shrink-0" />
              <CopyBadge href={data.website} text={data.website}>
                <p className="truncate">{data.website}</p>
              </CopyBadge>
            </div>
          )}

          {data.taxonomyTerms && data.taxonomyTerms.length > 0 && (
            <>
              <Separator />

              <p className="text-sm font-semibold">
                {t('categories_text', {
                  ns: 'dynamic',
                  defaultValue: t('categories', { ns: 'page-resource' }),
                })}
              </p>

              <div className="flex flex-wrap gap-1">
                {data.taxonomyTerms.map((term) => (
                  <Badge key={term} variant="default">
                    {term}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <ReferralButton
            className="flex-1 gap-1"
            size="sm"
            disabled={!data.phone}
            referralType="call_referral"
            resourceId={data.id}
            resourceData={data}
            variant="highlight"
            onClick={() => {
              window.open(`tel:${data.phone}`);
            }}
          >
            <Phone className="size-4" /> {t('call_to_action.call')}
          </ReferralButton>

          <ReferralButton
            className="flex-1 gap-1"
            referralType="website_referral"
            size="sm"
            resourceId={data.id}
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
            href={`/search/${data.id}`}
          >
            <LinkIcon className="size-4" /> {t('call_to_action.view_details')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
