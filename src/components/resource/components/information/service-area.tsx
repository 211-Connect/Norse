import { Resource } from '@/lib/server/adapters/resource-adapter';
import { IconMap2 } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function ServiceArea({ data }: { data: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!data.serviceAreaDescription) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconMap2 className="size-4" />

        <p className="font-semibold">{t('service_area')}</p>
      </div>
      <p className="text-sm">{data.serviceAreaDescription}</p>
    </div>
  );
}
