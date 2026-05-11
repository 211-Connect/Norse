'use client';

import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';

import { GetDirectionsButton } from '@/app/(app)/shared/components/get-directions-button';
import { userCoordinatesAtom } from '@/app/(app)/shared/store/search';
import { Resource } from '@/types/resource';

export function GetDirectionsComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');
  const coords = useAtomValue(userCoordinatesAtom);

  return (
    <GetDirectionsButton
      className="w-fit"
      data={resource}
      coords={coords}
      text={t('directions_button')}
    />
  );
}
