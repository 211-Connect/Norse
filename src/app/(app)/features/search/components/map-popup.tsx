import { ChevronRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badges } from '@/app/(app)/shared/components/badges';
import { Link } from '@/app/(app)/shared/components/link';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';

import { type PinSite } from '../utils/map-pins';

interface MapPopupProps {
  id: string;
  name: string;
  address?: string;
  distance?: number;
  labels?: string[];
}

function MapPopupLocation({
  address,
  distance,
}: Pick<MapPopupProps, 'address' | 'distance'>) {
  const { t } = useTranslation('common');

  if (!address) return null;

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex gap-[6px]">
        <MapPin className="text-primary mt-[2px] size-4" />
        <p className="flex-1 text-sm">{address}</p>
      </div>
      {distance && (
        <p className="text-sm">{`${distance.toFixed(1)} ${t('search.miles_short', { ns: 'common' })}`}</p>
      )}
    </div>
  );
}

export function MapPopup({
  distance,
  id,
  name,
  address,
  labels = [],
}: MapPopupProps) {
  const { t } = useTranslation('common');
  const badges = labels.map((label) => ({ label }));

  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-3">
        {badges.length > 0 && <Badges items={badges} />}
        <p className="text-sm font-medium">{name}</p>
        <MapPopupLocation address={address} distance={distance} />
        <Link
          href={`/search/${id}`}
          aria-label={`${t('learn_more', { ns: 'page-search' })}: ${name}`}
          className="text-primary py-[5px] text-center text-sm font-medium hover:underline"
          prefetch={false}
        >
          {t('learn_more', { ns: 'page-search' })}
          <ChevronRight className="ml-1 inline-block size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

/** Several resources in one building: there is no single pin to open. */
export function MapSitePopup({
  site,
  distance,
}: {
  site: PinSite;
  distance?: number;
}) {
  const { t } = useTranslation('page-search');

  return (
    <Card className="shadow-md">
      <CardContent className="flex flex-col gap-3">
        <p className="pr-6 text-sm font-medium">
          {t('map_site_title', {
            count: site.length,
            defaultValue: '{{count}} resources at this location',
          })}
        </p>
        <MapPopupLocation address={site[0].address} distance={distance} />
        <ul className="border-border -mx-1 flex max-h-44 flex-col divide-y overflow-y-auto border-t">
          {site.map((pin) => (
            <li key={pin.id}>
              <Link
                href={`/search/${pin.resourceId}`}
                className="hover:bg-accent focus-visible:ring-ring flex items-start justify-between gap-2 rounded-sm px-1 py-2 text-sm no-underline transition-colors focus-visible:ring-2 focus-visible:outline-none"
                prefetch={false}
              >
                <span className="min-w-0 flex-1 break-words">{pin.name}</span>
                <ChevronRight className="text-primary mt-[2px] size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
