import { useAppConfig } from '@/lib/context/app-config-context';
import { Suggestion } from '@/types/suggestion';
import { Taxonomy } from '@/types/taxonomy';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

type useOptionsProps = {
  suggestions: Suggestion[];
  taxonomies: Taxonomy[];
  searchTerm: string | undefined;
};

export function useOptions({
  suggestions,
  taxonomies,
  searchTerm = '',
}: useOptionsProps) {
  const t = useTranslations('common');
  const appConfig = useAppConfig();

  return useMemo(() => {
    return [
      ...suggestions
        .map((option) => ({
          value: option.displayName,
          group: t('search.suggestions'),
        }))
        .filter((option) =>
          option.value?.toLowerCase()?.includes(searchTerm.toLowerCase()),
        ),
      ...taxonomies.map((option) => ({
        group: t('search.taxonomies'),
        value: option.name,
        label: appConfig.featureFlags?.showTaxonomyBadge ? option.code : null,
      })),
    ];
  }, [
    suggestions,
    taxonomies,
    searchTerm,
    appConfig.featureFlags?.showTaxonomyBadge,
    t,
  ]);
}
