'use client';

import { SearchCardComponentProps } from './types';
import { CategoriesComponent as ResourceCategoriesComponent } from '../../../resource/components/resource-components';

export function CategoriesComponent({ result }: SearchCardComponentProps) {
  const resource = { categories: result?.taxonomies };
  return <ResourceCategoriesComponent resource={resource} />;
}
