import { IResource } from '@/types/resource';
import { IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function Eligibility({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.eligibilities) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconCheck className="size-4" />

        <p className="font-semibold">{t('eligibility')}</p>
      </div>

      <p className="text-sm">{data.eligibilities}</p>
    </div>
  );
}
