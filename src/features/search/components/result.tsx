import { buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Link } from '@/shared/components/link';
import {
  cn,
  distanceBetweenCoordsInKm,
  getGoogleMapsDestinationUrl,
} from '@/shared/lib/utils';
import { ResultType } from '@/shared/store/results';
import { LinkIcon, MapPin, Phone, Pin } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { Badge } from '@/shared/components/ui/badge';
import { useAtomValue } from 'jotai';
import {
  searchCoordinatesAtom,
  userCoordinatesAtom,
} from '@/shared/store/search';
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
import { useFlag } from '@/shared/hooks/use-flag';
import { Badges } from '@/shared/components/badges';

type ResultProps = {
  data: ResultType;
};

export function Result({ data }: ResultProps) {
  const { t } = useTranslation();
  const coords = useAtomValue(userCoordinatesAtom);
  const searchCoords = useAtomValue(searchCoordinatesAtom);

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
      <Card id={data._id} className="flex flex-col gap-3 print:border-none">
        {labels.length > 0 ||
          (data.priority === 1 && (
            <CardHeader>
              <div className="flex justify-between">
                {labels.length > 0 && <Badges items={labels} />}
                <div className="flex items-center justify-start">
                  {data.priority === 1 && (
                    <Badge variant="outline" className="flex gap-1">
                      {t('pinned', { ns: 'page-search' })}
                      <Pin className="size-4" />
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          ))}
        <CardTitle className="flex flex-row justify-between gap-2">
          <Link
            className="self-center hover:underline"
            href={`/search/${data.id}`}
          >
            {data.name}
          </Link>

          <div className="print:hidden">
            <AddToFavoritesButton size="icon" serviceAtLocationId={data.id} />
          </div>
        </CardTitle>
        <CardContent className="flex flex-col gap-3">
          {data.address ? (
            <div className="flex justify-between gap-3">
              <div className="flex max-w-full items-center gap-1">
                <MapPin className="mt-[2px] size-4 shrink-0 self-start text-primary" />
                <CopyBadge
                  className="max-w-[240px] text-sm font-normal"
                  text={data.address}
                  href={getGoogleMapsDestinationUrl(
                    coords,
                    data?.location?.coordinates,
                  )}
                >
                  {data.address}
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

          {data.phone && (
            <div className="flex max-w-full items-center gap-1">
              <Phone className="size-4 shrink-0 text-primary" />
              <CopyBadge
                className="text-sm font-normal"
                text={data.phone}
                href={`tel:${data.phone}`}
              >
                {data.phone}
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

          <div className="whitespace-break-spaces text-sm print:hidden">
            {parseHtml(data?.summary ?? data.description)}
          </div>

          <div className="hidden whitespace-break-spaces text-sm print:block">
            {parseHtml(data?.description ?? data.summary)}
          </div>

          {data.taxonomies && data.taxonomies.length > 0 && (
            <>
              <Separator className="print:hidden" />

              <p className="text-sm font-semibold print:hidden">
                {t('categories_title', { ns: 'page-resource' })}
              </p>

              <div className="flex flex-col items-start gap-3 print:hidden">
                {data.taxonomies.map((tax) => (
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
              <LinkIcon className="size-4" /> {t('call_to_action.view_website')}
            </ReferralButton>

            <GetDirectionsButton data={data} coords={searchCoords} />
          </div>

          <div className="flex w-full items-center gap-2">
            <Link
              className={cn(
                'flex-1 gap-1 text-primary',
                buttonVariants({ variant: 'ghost' }),
              )}
              href={`/search/${data.id}`}
            >
              {t('call_to_action.view_details')}
            </Link>
          </div>
        </CardFooter>
      </Card>

      <Separator className="hidden border-b border-black bg-none print:block" />
    </>
  );
}
