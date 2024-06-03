import { Anchor } from '@/components/anchor';
import { IResource } from '@/types/resource';
import { Phone, Printer } from 'lucide-react';
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
              <div className="flex items-center gap-1">
                {phone.type === 'fax' ? (
                  <Printer className="size-4" />
                ) : (
                  <Phone className="size-4" />
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
