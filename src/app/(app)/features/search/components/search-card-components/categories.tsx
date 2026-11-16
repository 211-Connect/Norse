'use client';

import { CategoriesComponent as ResourceCategoriesComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

/**
 * A results card shows at most this many "What's Here" categories. A police department listed
 * 45 of them, which pushed every other result off the screen (UX pass 2026-11-16). The resource
 * page still shows them all.
 */
export const MAX_CARD_CATEGORIES = 6;

export function CategoriesComponent({ result }: SearchCardComponentProps) {
  const all = result?.taxonomies ?? [];
  const hidden = Math.max(0, all.length - MAX_CARD_CATEGORIES);
  const resource = { categories: all.slice(0, MAX_CARD_CATEGORIES) };
  return (
    <div>
      <ResourceCategoriesComponent resource={resource} />
      {hidden > 0 && (
        <p className="text-muted-foreground mt-1 text-xs">
          +{hidden} more on the service page
        </p>
      )}
    </div>
  );
}
