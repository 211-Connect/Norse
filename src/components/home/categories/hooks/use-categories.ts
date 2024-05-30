import { useTranslation } from 'next-i18next';

export function useCategories() {
  const { t } = useTranslation('categories');
  const categories = t('categories', { returnObjects: true });
  return categories as any; // COME BACK AND TYPE THIS
}
