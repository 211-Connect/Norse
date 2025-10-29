'use client';

import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';

interface SearchButtonProps {
  loading?: boolean;
}

export function SearchButton({ loading = false }: SearchButtonProps) {
  const { t } = useTranslation('common');

  return (
    <Button className="!m-0" type="submit" loading={loading}>
      {t('call_to_action.search')}
    </Button>
  );
}
