import { IResource } from '@/types/resource';
import { Receipt } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function Fees({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.fees) return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Receipt className="size-4" />

        <p className="font-semibold">{t('fee')}</p>
      </div>
      <p className="text-sm">{data.fees}</p>
    </div>
  );
}
