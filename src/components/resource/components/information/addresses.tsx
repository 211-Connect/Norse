import { IResource } from '@/types/resource';
import { Mailbox, MapPin } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function Addresses({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if ((data.addresses?.length ?? 0) === 0) return null;

  return (
    <>
      {data.addresses
        .sort((a: any, b: any) => a.rank - b.rank)
        .map((address: any, key) => {
          return (
            <div key={key}>
              <div className="flex items-center gap-1">
                {address.type === 'physical' ? (
                  <MapPin className="size-4" />
                ) : (
                  <Mailbox className="size-4" />
                )}

                <p className="font-semibold">
                  {address.type === 'physical' ? t('location') : t('mail')}
                </p>
              </div>
              <p className="text-sm">{`${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`}</p>
            </div>
          );
        })}
    </>
  );
}
