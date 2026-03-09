'use client';

import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
  formatAddressForDisplay,
  distanceBetweenCoordsInKm,
} from '@/app/(app)/shared/lib/utils';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { Resource } from '@/types/resource';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function AddressComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('common');
  const coords = useAtomValue(userCoordinatesAtom);

  const address = (resource.addresses ?? []).find(
    ({ type }) => type === 'physical',
  );

  const distance = useMemo(() => {
    if (!resource.location?.coordinates || (coords?.length ?? 0) !== 2) {
      return null;
    }

    return distanceBetweenCoordsInKm(
      coords as [number, number],
      resource.location.coordinates as [number, number],
    );
  }, [coords, resource.location?.coordinates]);

  if (!address) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="w-fit">
            <p className="truncate text-sm font-normal">
              {t('search.address_unavailable')}
            </p>
          </TooltipTrigger>
          <TooltipContent className="max-w-64" side="right">
            <p>{t('search.confidential_address')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const addressDisplay = formatAddressForDisplay(address);
  const distanceDisplay = distance
    ? `${distance.toFixed(1)} ${t('search.miles_short')}`
    : null;

  return (
    <div className="flex items-center justify-between gap-1">
      <Typography variant="paragraph" size="md">
        {addressDisplay}
      </Typography>
      {distance && (
        <Typography variant="paragraph" size="sm">
          {distanceDisplay}
        </Typography>
      )}
    </div>
  );
}
