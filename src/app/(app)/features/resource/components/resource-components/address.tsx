'use client';

import { useAtomValue } from 'jotai';
import { MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import {
  distanceBetweenCoordsInMiles,
  formatAddressForDisplay,
} from '@/app/(app)/shared/lib/utils';
import { ResultType } from '@/app/(app)/shared/store/results';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { Resource } from '@/types/resource';

import { UmamiEvent, trackUmamiEvent } from '../../../../shared/lib/umami';
import { Datum } from '../datum';

export function AddressComponent({
  resource,
  withIcon = false,
}: {
  resource: Resource | ResultType;
  withIcon?: boolean;
}) {
  const { t } = useTranslation('common');
  const coords = useAtomValue(userCoordinatesAtom);

  const address =
    'addresses' in resource
      ? (resource.addresses ?? []).find(({ type }) => type === 'physical')
      : resource.address;

  const distance = useMemo(() => {
    if (!resource.location?.coordinates || (coords?.length ?? 0) !== 2) {
      return null;
    }

    return distanceBetweenCoordsInMiles(
      coords as [number, number],
      resource.location.coordinates as [number, number],
    );
  }, [coords, resource.location?.coordinates]);

  const addressDisplay =
    typeof address === 'string' ? address : formatAddressForDisplay(address);

  const AddressElement = withIcon ? (
    <Datum
      icon={MapPin}
      description={address ? addressDisplay : t('search.address_unavailable')}
      size="sm"
      iconColor="text-primary"
      singleLine
      withPadding={false}
      onClick={() =>
        trackUmamiEvent(UmamiEvent.DirectionClick, {
          resourceId: resource.id,
        })
      }
    />
  ) : (
    <Typography variant="paragraph" size="md">
      {addressDisplay}
    </Typography>
  );

  if (!address) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-fit">{AddressElement}</div>
          </TooltipTrigger>
          <TooltipContent className="max-w-64" side="right">
            <p>{t('search.confidential_address')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const distanceDisplay = distance
    ? `${distance.toFixed(1)} ${t('search.miles_short')}`
    : null;

  return (
    <div className="flex items-center justify-between gap-1">
      {AddressElement}
      {distance && (
        <Typography variant="paragraph" size="sm" className="w-16 text-end">
          {distanceDisplay}
        </Typography>
      )}
    </div>
  );
}
