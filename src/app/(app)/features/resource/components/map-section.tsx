import { GetDirectionsButton } from '@/app/(app)/shared/components/get-directions-button';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Resource } from '@/types/resource';

import { MapContainer } from './map-container';

export function MapSection({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const coords = useAtomValue(userCoordinatesAtom);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg">
        <MapContainer resource={resource} />
      </div>
      <GetDirectionsButton
        className="w-fit"
        data={resource}
        coords={coords}
        text={t('directions_button')}
      />
    </div>
  );
}
