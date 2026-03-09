'use client';

import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function LanguagesComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');

  if (!resource.languages || resource.languages.length === 0) {
    return null;
  }

  const languages = resource.languages.join(', ');

  return (
    <Datum icon={Languages} title={t('languages')} description={languages} />
  );
}
