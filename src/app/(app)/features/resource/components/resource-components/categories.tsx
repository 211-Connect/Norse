'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from '@/app/(app)/shared/components/link';
import { Badge, badgeVariants } from '@/app/(app)/shared/components/ui/badge';
import { useFlag } from '@/app/(app)/shared/hooks/use-flag';
import { cn } from '@/app/(app)/shared/lib/utils';
import { Resource, Taxonomy } from '@/types/resource';
import { Typography } from '@/app/(app)/shared/components/ui/typography';

export function CategoriesComponent({ resource }: { resource: Resource }) {
  const { t } = useTranslation('page-resource');
  const showCategories = useFlag('showResourceCategories');
  const turnResourceCardTaxonomiesIntoLinks = useFlag(
    'turnResourceCardTaxonomiesIntoLinks',
  );

  const categories = useMemo(() => {
    return (resource.categories ?? []).filter(
      (el: Taxonomy) => el?.name && el?.code,
    );
  }, [resource.categories]);

  if (!showCategories || categories.length === 0) {
    return null;
  }

  return (
    <div>
      <Typography variant="label" size="sm">
        {t('categories_title')}
      </Typography>
      <div className="flex flex-wrap gap-1">
        {categories.map((el: Taxonomy) => {
          return turnResourceCardTaxonomiesIntoLinks ? (
            <Link
              key={el?.code}
              className={cn(badgeVariants(), 'hover:underline')}
              href={`/search?query=${encodeURIComponent(
                el?.code,
              )}&query_label=${encodeURIComponent(
                el?.name,
              )}&query_type=taxonomy`}
            >
              {el?.name}
            </Link>
          ) : (
            <Badge key={el?.code}>{el?.name}</Badge>
          );
        })}
      </div>
    </div>
  );
}
