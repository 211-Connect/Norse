import { IResource } from '@/types/resource';
import { Folder } from 'lucide-react';
import { useTranslation } from 'next-i18next';

export default function RequiredDocuments({ data }: { data: IResource }) {
  const { t } = useTranslation('page-resource');

  if (!data.requiredDocuments || data.requiredDocuments.length === 0)
    return null;

  return (
    <div>
      <div className="flex items-center gap-1">
        <Folder className="size-4" />

        <p className="font-semibold">{t('required_documents')}</p>
      </div>
      <p className="text-sm">{data.requiredDocuments}</p>
    </div>
  );
}
