import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';
import { DollarSign, Edit, Handshake, Languages, Map } from 'lucide-react';
import { parseHtml } from '@/shared/lib/parse-html';

import { LabeledElement } from './labeled-element';
import { Separator } from './separator';

export function DetailsSection({ resource }) {
  const { t } = useTranslation('page-resource');

  const {
    applicationProcess,
    fees,
    interpretationServices,
    languages,
    serviceAreaName,
    serviceAreaDescription,
  } = useMemo(() => {
    const {
      applicationProcess,
      fees,
      interpretationServices,
      languages = [],
      serviceAreaName,
      serviceAreaDescription,
    } = resource ?? {};
    return {
      applicationProcess,
      fees,
      interpretationServices,
      languages,
      serviceAreaName,
      serviceAreaDescription,
    };
  }, [resource]);

  const shouldRender =
    applicationProcess ||
    fees ||
    interpretationServices ||
    languages.length > 0 ||
    serviceAreaName ||
    serviceAreaDescription;
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-8">
        {languages.length > 0 && (
          <LabeledElement Icon={Languages} title={t('languages')}>
            <p className="text-sm">{languages.join(', ')}</p>
          </LabeledElement>
        )}
        {interpretationServices && (
          <LabeledElement Icon={Handshake} title={t('interpretation_services')}>
            <p className="whitespace-break-spaces text-sm">
              {parseHtml(interpretationServices, {
                parseLineBreaks: true,
              })}
            </p>
          </LabeledElement>
        )}
        {applicationProcess && (
          <LabeledElement Icon={Edit} title={t('application_process')}>
            <p className="text-sm">{parseHtml(applicationProcess)}</p>
          </LabeledElement>
        )}
        {fees && (
          <LabeledElement Icon={DollarSign} title={t('fee')}>
            <p className="text-sm">{parseHtml(fees)}</p>
          </LabeledElement>
        )}
        {(serviceAreaName || serviceAreaDescription) && (
          <LabeledElement Icon={Map} title={t('service_area')}>
            {serviceAreaName && (
              <p className="whitespace-break-spaces text-sm">
                {parseHtml(serviceAreaName, {
                  parseLineBreaks: true,
                })}
              </p>
            )}
            {serviceAreaDescription && (
              <p className="whitespace-break-spaces text-sm">
                {parseHtml(serviceAreaDescription, {
                  parseLineBreaks: true,
                })}
              </p>
            )}
          </LabeledElement>
        )}
      </div>
    </>
  );
}
