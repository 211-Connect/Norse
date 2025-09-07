'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type Subcategory = {
  name: string;
  href?: string;
  query: string;
  queryType: string;
};

export type Category = {
  name: string;
  href?: string;
  image?: string;
  subcategories?: Subcategory[];
};

export function useCategories() {
  const { i18n } = useTranslation();

  const categories = useMemo(() => {
    const resources = i18n.getResourceBundle(i18n.language, 'categories');

    // If resources is an array of objects
    if (Array.isArray(resources)) {
      return resources.map((item) => item.value) as Category[];
    }

    // If resources is an object
    return Object.values(resources) as Category[];
  }, [i18n]);

  return categories;
}
