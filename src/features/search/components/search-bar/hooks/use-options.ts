import { useAppConfig } from '@/lib/context/app-config-context';
import { Suggestion } from '@/types/suggestion';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

type useOptionsProps = {
  suggestions: Suggestion[];
  taxonomies: any[];
};

export function useOptions({ suggestions, taxonomies }: useOptionsProps) {
  const t = useTranslations('common');
  const appConfig = useAppConfig();

  return useMemo(() => {
    return [
      ...suggestions.map((option) => ({
        value: option.displayName,
        group: t('search.suggestions'),
      })),
      ...taxonomies.map((option) => ({
        group: t('search.taxonomies'),
        value: option.name,
        label: appConfig.featureFlags?.showTaxonomyBadge ? option.code : null,
      })),
    ];
  }, [suggestions, taxonomies, appConfig.featureFlags?.showTaxonomyBadge, t]);
}
