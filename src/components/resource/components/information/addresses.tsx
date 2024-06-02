import { IResource } from '@/types/resource';
import { IconMailbox, IconMapPin } from '@tabler/icons-react';
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
              <div className="flex gap-1 items-center">
                {address.type === 'physical' ? (
                  <IconMapPin className="size-4" />
                ) : (
                  <IconMailbox className="size-4" />
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
