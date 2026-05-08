'use client';

import { CategoriesComponent as ResourceCategoriesComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function CategoriesComponent({ result }: SearchCardComponentProps) {
  const resource = { categories: result?.taxonomies };
  return <ResourceCategoriesComponent resource={resource} />;
}
