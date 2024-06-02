import { IResource } from '@/types/resource';
import { MapIcon } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function ServiceArea({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data?.serviceArea?.description) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <MapIcon className="size-4" />

        <p className="font-semibold">{t('service_area')}</p>
      </div>
      <p className="text-sm">{data.serviceArea.description}</p>
    </div>
  );
}
