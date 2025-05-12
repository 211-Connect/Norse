'use client';
import { Suggestion } from '@/types/suggestion';
import { createContext, useContext } from 'react';

const suggestionsContext = createContext<Suggestion[] | undefined | null>(
  undefined,
);

type SuggestionsProviderProps = {
  value: Suggestion[] | null;
  children: React.ReactNode;
};

export function SuggestionsProvider({
  value,
  children,
}: SuggestionsProviderProps) {
  return (
    <suggestionsContext.Provider value={value}>
      {children}
    </suggestionsContext.Provider>
  );
}

export function useSuggestions() {
  const context = useContext(suggestionsContext);
  if (!context) {
    throw new Error(
      'useSuggestions must be used within an SuggestionsProvider',
    );
  }
  return context;
}
