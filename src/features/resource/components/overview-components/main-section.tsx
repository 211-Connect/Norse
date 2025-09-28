import { distanceBetweenCoordsInKm } from '@/shared/lib/utils';
import { Alert as AlertComponent } from '@/shared/components/ui/alert';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';
import {
  Accessibility,
  BusFront,
  Clock,
  FileCheck2,
  TriangleAlert,
} from 'lucide-react';
import { parseHtml } from '@/shared/lib/parse-html';
import { useAtomValue } from 'jotai';
import { userCoordinatesAtom } from '@/shared/store/search';

import { LabeledElement } from './labeled-element';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export function MainSection({ resource }) {
  const { i18n, t } = useTranslation('page-resource');

  const coords = useAtomValue(userCoordinatesAtom);

  console.log(resource);

  const {
    accessibility,
    addresses,
    eligibilities,
    hours,
    location,
    requiredDocuments,
    transportation,
    translations,
  } = useMemo(() => {
    const {
      accessibility,
      addresses,
      eligibilities,
      hours,
      location,
      requiredDocuments,
      transportation,
      translations,
    } = resource ?? {};

    return {
      accessibility,
      addresses,
      eligibilities,
      hours,
      location,
      requiredDocuments,
      transportation,
      translations,
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

  const alert = useMemo(
    () => translations?.[i18n.language]?.alert,
    [i18n.language, translations],
  );

  return (
    <>
      <div className="flex flex-col gap-3">
        {address ? (
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
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="w-fit">
                <p className="truncate text-sm font-normal">
                  {t('search.address_unavailable', { ns: 'common' })}
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-64" side="right">
                <p>{t('search.confidential_address', { ns: 'common' })}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
            <BusFront className="size-4 text-positive" />
            <p className="text-sm">
              {parseHtml(transportation, {
                parseLineBreaks: true,
              })}
            </p>
          </div>
        )}
        {accessibility && (
          <div className="flex items-center gap-[6px]">
            <Accessibility className="size-4 text-custom-blue" />
            <p className="text-sm">
              {parseHtml(accessibility, {
                parseLineBreaks: true,
              })}
            </p>
          </div>
        )}
      </div>
      {eligibilities && (
        <div className="mt-8 whitespace-pre-line">
          <LabeledElement
            Icon={TriangleAlert}
            IconCustomClasses="text-destructive"
            title={t('eligibility')}
          >
            {parseHtml(eligibilities)}
          </LabeledElement>
        </div>
      )}
      {requiredDocuments && requiredDocuments.length > 0 && (
        <div className="mt-8 whitespace-pre-line">
          <LabeledElement Icon={FileCheck2} title={t('required_documents')}>
            {requiredDocuments
              .map((document) => document.replaceAll(';', '\n'))
              .join('\n')}
          </LabeledElement>
        </div>
      )}
      {hours && (
        <div className="mt-8 whitespace-pre-line">
          <LabeledElement Icon={Clock} title={t('hours')}>
            {hours.replaceAll(';', '\n')}
          </LabeledElement>
        </div>
      )}
    </>
  );
}
