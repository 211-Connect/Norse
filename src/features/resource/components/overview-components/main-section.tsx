import { distanceBetweenCoordsInKm } from '@/shared/lib/utils';
import { Alert as AlertComponent } from '@/shared/components/ui/alert';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import { Accessibility, BusFront, TriangleAlert } from 'lucide-react';
import { parseHtml } from '@/shared/lib/parse-html';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';

import { LabeledElement } from './labeled-element';

export function MainSection({ resource }) {
  const { t } = useTranslation('page-resource');

  const coords = useAtomValue(userCoordinatesAtom);

  const { accessibility, addresses, eligibilities, location, transportation } =
    useMemo(() => {
      const {
        accessibility,
        addresses,
        eligibilities,
        location,
        transportation,
      } = resource ?? {};

      return {
        accessibility,
        addresses,
        eligibilities,
        location,
        transportation,
      };
    }, [resource]);

  const address = useMemo(() => {
    return (addresses ?? []).find(({ type }) => type === 'physical');
  }, [addresses]);

  const distance = useMemo(() => {
    if (!location?.coordinates || (coords?.length ?? 0) !== 2) {
      return null;
    }

    return distanceBetweenCoordsInKm(
      coords as [number, number],
      location.coordinates,
    );
  }, [coords, location.coordinates]);

  // HARDCODED
  const alert = 'Temporary closed Dec-Jan.';

  return (
    <>
      <div className="flex flex-col gap-3">
        {address && (
          <div className="flex items-center justify-between gap-1">
            <p className="text-base">
              {`${address.address_1},${address.address_2 ? ` ${address.address_2},` : ''} ${address.city}, ${address.stateProvince} ${address.postalCode}`}
            </p>
            {distance && (
              <p className="text-sm">
                {distance.toFixed(1)}{' '}
                {t('search.miles_short', { ns: 'common' })}
              </p>
            )}
          </div>
        )}
        {alert && (
          <AlertComponent className="rounded-lg bg-primary/5 p-3">
            <div className="flex items-center gap-1">
              <TriangleAlert className="size-4 text-destructive" />
              <p className="text-sm">{alert}</p>
            </div>
          </AlertComponent>
        )}
        {transportation && (
          <div className="flex items-center gap-[6px]">
            <BusFront className="text-positive size-4" />
            <p className="text-sm">
              {parseHtml(transportation, {
                parseLineBreaks: true,
              })}
            </p>
          </div>
        )}
        {accessibility && (
          <div className="flex items-center gap-[6px]">
            <Accessibility className="text-custom-blue size-4" />
            <p className="text-sm">
              {parseHtml(accessibility, {
                parseLineBreaks: true,
              })}
            </p>
          </div>
        )}
      </div>
      {eligibilities && (
        <div className="mt-8">
          <LabeledElement
            Icon={TriangleAlert}
            IconCustomClasses="text-destructive"
            title={t('eligibility')}
          >
            {parseHtml(eligibilities)}
          </LabeledElement>
        </div>
      )}
    </>
  );
}
