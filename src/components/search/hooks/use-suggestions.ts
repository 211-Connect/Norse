import { useMemo } from 'react';
import { useTranslation } from 'next-i18next';

export default function useSuggestions() {
  const { t } = useTranslation('suggestions');
  const suggestions = t('suggestions', { returnObjects: true }) as any[];

  const translatedSuggestions = useMemo(() => {
    return (
      suggestions?.map((suggestion) => ({
        ...suggestion,
        value: suggestion.value,
        term: suggestion.term,
      })) ?? []
    );
  }, [suggestions]);

  return translatedSuggestions;
}
