import { Phone, Printer } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function PhoneNumbersSection({ phoneNumbers = [] }) {
  const { t } = useTranslation('page-resource');

  const mappedPhoneNumbers = useMemo(() => {
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
  }, [phoneNumbers, t]);

  if (mappedPhoneNumbers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-x-12 gap-y-6">
      {mappedPhoneNumbers.map(({ description, Icon, label, number }) => (
        <div className="flex gap-[6px]" key={number}>
          <Icon className="mt-1 size-4" />
          <div>
            <Link className="text-base hover:underline" href={`tel:${number}`}>
              {number}
            </Link>
            <p className="mt-1 text-sm font-semibold">
              {label}
              {description && (
                <span className="font-normal"> - {description}</span>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
