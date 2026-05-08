'use client';

import { Resource } from '@/types/resource';
import { Phone, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { UmamiEvent, trackUmamiEvent } from '../../../../shared/lib/umami';
import { Datum } from '../datum';

export function PhoneNumbersComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  const mappedPhoneNumbers = useMemo(() => {
    const phoneNumbers = resource.phoneNumbers ?? [];
    return phoneNumbers.map((phone) => {
      const { description, number, type } = phone;

      let Icon = Phone;
      let label = t('voice');

      if (type === 'fax') {
        Icon = Printer;
        label = t('fax');
      }

      return {
        description,
        Icon,
        label,
        number,
      };
    });
  }, [resource.phoneNumbers, t]);

  if (mappedPhoneNumbers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap">
      {mappedPhoneNumbers.map(({ description, Icon, label, number }) => (
        <Datum
          key={number}
          icon={Icon}
          title={label}
          subtitle={description}
          description={number}
          url={`tel:${number}`}
          urlAriaLabel={`${label}${description ? ` - ${description}` : ''}: ${number}`}
          onClick={() =>
            trackUmamiEvent(UmamiEvent.PhoneClick, {
              resourceId: resource.id,
            })
          }
          urlTarget="_self"
          titleBelow
          shouldParseHtml={false}
          className="w-full lg:w-1/2"
        />
      ))}
    </div>
  );
}
