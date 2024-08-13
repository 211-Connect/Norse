import { useTranslation } from 'next-i18next';
import { useCallback } from 'react';

export function useCategories() {
  const { i18n } = useTranslation('categories');

  // Get all translations
  const getAllTranslations = useCallback(() => {
    // Access the entire translation object
    const resources = i18n.getResourceBundle(i18n.language, 'categories');

    // If resources is an array of objects
    if (Array.isArray(resources)) {
      return resources.map((item) => item.value);
    }

    // If resources is an object
    return Object.values(resources);
  }, [i18n]);

  return getAllTranslations();
}
