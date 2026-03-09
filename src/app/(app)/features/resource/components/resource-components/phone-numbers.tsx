'use client';

import { Phone, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Resource } from '@/types/resource';
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
    <div className="flex flex-wrap gap-4">
      {mappedPhoneNumbers.map(({ description, Icon, label, number }) => (
        <Datum
          key={number}
          icon={Icon}
          title={label}
          subtitle={description}
          description={number}
          url={`tel:${number}`}
          urlTarget="_self"
          titleBelow
        />
      ))}
    </div>
  );
}
