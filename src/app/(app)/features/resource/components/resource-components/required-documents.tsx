'use client';

import { useTranslation } from 'react-i18next';
import { FileCheck2 } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

export function RequiredDocumentsComponent({
  resource,
}: ResourceComponentProps) {
  const { t } = useTranslation('page-resource');

  if (!resource.requiredDocuments || resource.requiredDocuments.length === 0) {
    return null;
  }

  const content = resource.requiredDocuments
    .map((document) => document.replaceAll(';', '\n'))
    .join('\n');

  return (
    <Datum
      icon={FileCheck2}
      title={t('required_documents')}
      description={content}
    />
  );
}
