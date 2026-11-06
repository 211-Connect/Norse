import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Badges } from '@/app/(app)/shared/components/badges';
import { Link } from '@/app/(app)/shared/components/link';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { Card, CardContent } from '@/app/(app)/shared/components/ui/card';
import { cn } from '@/app/(app)/shared/lib/utils';

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

  if (!address && !distance) return null;

  return (
    <div className="text-muted-foreground flex flex-col gap-0.5 text-xs leading-relaxed">
      {address && <p>{address}</p>}
      {!!distance && (
        <p>{`${distance.toFixed(1)} ${t('search.miles_short', { ns: 'common' })}`}</p>
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
        <p className="pr-6 text-sm leading-snug font-semibold">{name}</p>
        <MapPopupLocation address={address} distance={distance} />
        <Link
          href={`/search/${id}`}
          aria-label={`${t('learn_more', { ns: 'page-search' })}: ${name}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}
          prefetch={false}
        >
          {t('learn_more', { ns: 'page-search' })}
        </Link>
      </CardContent>
    </Card>
  );
}

/** Several resources in one building: there is no single pin to open. */
export function MapSitePopup({
  site,
  distance,
  listIds,
}: {
  site: PinSite;
  distance?: number;
  /** Ids of the list's current page: those resources are marked, as on the map. */
  listIds?: ReadonlySet<string>;
}) {
  const { t } = useTranslation('page-search');

  return (
    <Card className="flex max-h-(--map-popup-max-height) flex-col shadow-md">
      <CardContent className="flex min-h-0 flex-col gap-3">
        <p className="pr-6 text-sm leading-snug font-semibold">
          {t('map_site_title', {
            count: site.length,
            defaultValue: '{{count}} resources at this location',
          })}
        </p>
        <MapPopupLocation address={site[0].address} distance={distance} />
        <ul className="border-border -mx-1 flex min-h-0 flex-col divide-y overflow-y-auto border-t">
          {site.map((pin) => {
            const isInList = listIds?.has(pin.id) ?? false;

            return (
              <li key={pin.id}>
                <Link
                  href={`/search/${pin.resourceId}`}
                  className={cn(
                    'hover:bg-accent focus-visible:ring-ring flex items-start gap-2 rounded-sm px-1 py-1.5 text-sm no-underline transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    isInList && 'bg-primary/5',
                  )}
                  prefetch={false}
                >
                  {/* The same dot as the list's circles and the legend. */}
                  <span
                    aria-hidden
                    className={cn(
                      'mt-[6px] size-2 shrink-0 rounded-full',
                      isInList ? 'bg-primary' : 'bg-transparent',
                    )}
                  />
                  <span className="min-w-0 flex-1 break-words">
                    {pin.name}
                    {isInList && (
                      <span className="sr-only">
                        {`, ${t('map_legend_list', { defaultValue: 'In the list' })}`}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="text-primary mt-[2px] size-4 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
