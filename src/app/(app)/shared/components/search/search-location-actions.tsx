'use client';

import { cn } from '../../lib/utils';
import { DistanceSelect, DistanceSelectProps } from './distance-select';
import { UseMyLocationButton } from './use-my-location-button';

type SearchLocationActionsProps = {
  className?: string;
  showUseMyLocationButton?: boolean;
  distanceSelectProps?: DistanceSelectProps;
};

export function SearchLocationActions({
  className,
  showUseMyLocationButton = true,
  distanceSelectProps,
}: SearchLocationActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    >
      {showUseMyLocationButton && <UseMyLocationButton />}
      <DistanceSelect className="ml-auto" {...distanceSelectProps} />
    </div>
  );
}
