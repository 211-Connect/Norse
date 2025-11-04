import { GetDirectionsButton } from '@/shared/components/get-directions-button';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';
import { useTranslation } from 'next-i18next';

import { MapContainer } from './map-container';

export function MapSection({ resource }) {
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
