import { IResource } from '@/types/resource';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function ApplicationProcess({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.applicationProcess) return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Pencil className="size-4" />

        <p className="font-semibold">{t('application_process')}</p>
      </div>
      <p className="text-sm">{data.applicationProcess}</p>
    </div>
  );
}
