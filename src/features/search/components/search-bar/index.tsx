'use client';
import { Autocomplete } from '@/components/autocomplete';
import { useSuggestions } from '@/lib/context/suggestions-context';
import { useState } from 'react';
import { useTaxonomies } from './hooks/use-taxonomies';
import { useOptions } from './hooks/use-options';
import { useAppConfig } from '@/lib/context/app-config-context';
import { SearchIcon } from 'lucide-react';
import { useSearchStore } from '@/lib/context/search-context/search-store-provider';

export function SearchBar() {
  const appConfig = useAppConfig();
  const suggestions = useSuggestions();
  const { inputValue, setInputValue } = useSearchStore((store) => ({
    inputValue: store.searchTerm,
    setInputValue: store.setSearchTerm,
  }));
  const { data: taxonomies } = useTaxonomies();

  const options = useOptions({
    suggestions,
    taxonomies,
    searchTerm: inputValue,
  });

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  return (
    <div className="flex w-full items-center space-x-2 border-b">
      <SearchIcon size={16} className="opacity-50" />
      <Autocomplete
        options={options}
        onInputChange={handleInputChange}
        placeholder={appConfig.search?.queryInputPlaceholder}
        defaultValue={inputValue}
      />
    </div>
  );
}
