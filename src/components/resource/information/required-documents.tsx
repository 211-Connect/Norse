import { Resource } from '@/lib/server/adapters/resource-adapter';
import { IconFolder } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';

export default function RequiredDocuments({ data }: { data: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!data.requiredDocuments || data.requiredDocuments.length === 0)
    return null;

  return (
    <div>
      <div className="flex gap-1 items-center">
        <IconFolder className="size-4" />

        <p className="font-semibold">{t('required_documents')}</p>
      </div>
      <p className="text-sm">{data.requiredDocuments}</p>
    </div>
  );
}
