import { IResource } from '@/types/resource';
import { Clock } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function Hours({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.hours) return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Clock className="size-4" />

        <p className="font-semibold">{t('hours')}</p>
      </div>
      <p className="text-sm">{data.hours}</p>
    </div>
  );
}
