import { Resource } from '@/lib/server/adapters/resource-adapter';
import { IconClock } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function Hours({ data }: { data: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!data.hours) return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconClock className="size-4" />

        <p className="font-semibold">{t('hours')}</p>
      </div>
      <p className="text-sm">{data.hours}</p>
    </div>
  );
}
