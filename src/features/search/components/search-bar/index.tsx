'use client';
import { Autocomplete } from '@/components/autocomplete';
import { useSuggestions } from '@/lib/context/suggestions-context';
import { useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { useTaxonomies } from './hooks/use-taxonomies';
import { useOptions } from './hooks/use-options';
import { useAppConfig } from '@/lib/context/app-config-context';
import { SearchIcon } from 'lucide-react';

export function SearchBar() {
  const appConfig = useAppConfig();
  const [value, setValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);
  const { data: taxonomies } = useTaxonomies(debouncedValue);
  const suggestions = useSuggestions();

  const options = useOptions({ suggestions, taxonomies });

  const handleValueChange = (value) => {
    setValue(value);
  };

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  return (
    <div className="flex items-center space-x-2 border-b">
      <SearchIcon size={16} />
      <Autocomplete
        options={options}
        onValueChange={handleValueChange}
        onInputChange={handleInputChange}
        value={value}
        placeholder={appConfig.search?.queryInputPlaceholder}
      />
    </div>
  );
}
