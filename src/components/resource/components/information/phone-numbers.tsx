import { Anchor } from '@/components/anchor';
import { IResource } from '@/types/resource';
import { IconPhone, IconPrinter } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function PhoneNumbers({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if ((data.phoneNumbers?.length ?? 0) === 0) return null;

  return (
    <>
      {data.phoneNumbers
        .sort((a: any, b: any) => a.rank - b.rank)
        .map((phone: any, idx) => {
          return (
            <div key={idx}>
              <div className="flex gap-1 items-center">
                {phone.type === 'fax' ? (
                  <IconPrinter className="size-4" />
                ) : (
                  <IconPhone className="size-4" />
                )}

                <p className="font-semibold">
                  {phone.type === 'fax' ? t('fax') : t('voice')}
                </p>
              </div>
              {phone.type === 'voice' ? (
                <Anchor className="text-sm" href={`tel:${phone.number}`}>
                  {phone.number}
                </Anchor>
              ) : (
                <p className="text-sm">{phone.number}</p>
              )}
            </div>
          );
        })}
    </>
  );
}
