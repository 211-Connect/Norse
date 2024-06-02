import { IResource } from '@/types/resource';
import { IconEdit } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function ApplicationProcess({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.applicationProcess) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconEdit className="size-4" />

        <p className="font-semibold">{t('application_process')}</p>
      </div>
      <p className="text-sm">{data.applicationProcess}</p>
    </div>
  );
}
