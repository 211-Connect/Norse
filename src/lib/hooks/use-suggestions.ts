import { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'next-i18next';

const suggestionsContext = createContext<
  {
    id: string | number;
    value: string;
    term: string;
  }[]
>([]);

export const SuggestionsProvider = suggestionsContext.Provider;

export default function useSuggestions() {
  const suggestions = useContext(suggestionsContext);
  const { t } = useTranslation();

  const translatedSuggestions = useMemo(() => {
    return (
      suggestions?.map((suggestion, key) => ({
        ...suggestion,
        value: t(`suggestions.${key}`, {
          defaultValue: suggestion.value,
          ns: 'dynamic',
        }),
        term: suggestion.term,
      })) ?? []
    );
  }, [suggestions, t]);

  return translatedSuggestions;
}
