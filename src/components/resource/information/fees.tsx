import { Resource } from '@/lib/server/adapters/resource-adapter';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function Fees({ data }: { data: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!data.fees) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconCurrencyDollar className="size-4" />

        <p className="font-semibold">{t('fee')}</p>
      </div>
      <p className="text-sm">{data.fees}</p>
    </div>
  );
}
