import { parseHtml } from '@/lib/utils/parseHtml';
import { Button, buttonVariants } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Link } from '@/shared/components/link';
import { cn, distanceBetweenCoordsInMiles } from '@/shared/lib/utils';
import { ResultType } from '@/shared/store/results';
import {
  Globe,
  Heart,
  LinkIcon,
  MapPin,
  Navigation,
  Phone,
  Pin,
} from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { ReferralLink } from '@/shared/components/referral-link';
import { Badge } from '@/shared/components/ui/badge';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';
import { Separator } from '@/shared/components/ui/separator';

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
      : null;

  return (
    <Card>
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
                <MapPin className="size-3" />
                {distance.toLocaleString()} {t('search.miles')}
              </Badge>
            )}
          </div>
        </div>

        <CardTitle className="text-lg">{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div>{parseHtml(data.description)}</div>

        <div className="flex flex-col items-start justify-start gap-1">
          {data.taxonomyTerms && data.taxonomyTerms.length > 0 && (
            <>
              <p>
                {t('categories_text', {
                  ns: 'dynamic',
                  defaultValue: t('categories', { ns: 'page-resource' }),
                })}
              </p>

              <div className="flex flex-wrap gap-1">
                {data.taxonomyTerms.map((term) => (
                  <Badge key={term} variant="outline">
                    {term}
                  </Badge>
                ))}
              </div>

              <Separator className="mb-2 mt-2" />
            </>
          )}

          {data.phone && (
            <Badge variant="outline" className="max-w-full">
              <p className="truncate">{data.phone}</p>
            </Badge>
          )}
          {data.address && (
            <Badge variant="outline" className="max-w-full">
              <p className="truncate">{data.address}</p>
            </Badge>
          )}
          {data.website && (
            <Badge variant="outline" className="max-w-full">
              <p className="truncate">{data.website}</p>
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="flex w-full items-center gap-2">
          <ReferralLink
            className="flex-1 gap-1"
            referralType="call_referral"
            resourceId={data.id}
            resource={data}
            href={`tel:${data.phone}`}
            variant="outline"
          >
            <Phone className="size-4" /> {t('call_to_action.call')}
          </ReferralLink>

          <ReferralLink
            className="flex-1 gap-1"
            referralType="website_referral"
            resourceId={data.id}
            resource={data}
            href={data.website || ''}
            target="_blank"
            variant="outline"
          >
            <Globe className="size-4" /> {t('call_to_action.view_website')}
          </ReferralLink>

          <ReferralLink
            className="flex-1 gap-1"
            referralType="directions_referral"
            resourceId={data.id}
            resource={data}
            target="_blank"
            // href={`https://www.google.com/maps/dir/?api=1&origin=${
            //   props.coordinates
            // }&destination=${
            //   props?.location?.coordinates
            //     ? Array.from(props?.location?.coordinates).reverse().join(',')
            //     : ''
            // }`}
            href=""
            variant="outline"
          >
            <Navigation className="size-4" />{' '}
            {t('call_to_action.get_directions')}
          </ReferralLink>
        </div>

        <div className="flex w-full items-center gap-2">
          <Link
            className={cn('flex-1 gap-1', buttonVariants())}
            href={`/search/${data.id}`}
          >
            <LinkIcon className="size-4" /> {t('call_to_action.view_details')}
          </Link>

          <Button size="icon">
            <Heart className="size-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
