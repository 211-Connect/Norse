'use client';

import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function useSuggestions() {
  const { i18n } = useTranslation();

  const suggestions = useMemo(() => {
    // Access the entire translation object
    const resources = i18n.getResourceBundle(i18n.language, 'suggestions');

    // If resources is an array of objects
    if (Array.isArray(resources)) {
      return resources.map((item) => item.value);
    }

    // If resources is an object
    return Object.values(resources);
  }, [i18n]);

  return suggestions;
}
