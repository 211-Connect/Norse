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
import { ResultType } from '@/app/(app)/shared/store/results';
import { Datum } from '../datum';
import { MapPin } from 'lucide-react';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';

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

    return distanceBetweenCoordsInKm(
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
      className="py-0"
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
          <TooltipTrigger className="w-fit">{AddressElement}</TooltipTrigger>
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
