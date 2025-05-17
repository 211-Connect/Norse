import { MapPinIcon } from 'lucide-react';
import { useAddresses } from './hooks/use-addresses';
import { Autocomplete } from '@/components/autocomplete';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useState } from 'react';
import { useDebounce } from '@uidotdev/usehooks';
import { useOptions } from './hooks/use-options';

export function AddressBar() {
  const appConfig = useAppConfig();
  const [value, setValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);
  const { data: addresses } = useAddresses(debouncedValue);

  const options = useOptions({ addresses });

  const handleValueChange = (value) => {
    setValue(value);
  };

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  return (
    <div className="flex w-full items-center space-x-2 border-b">
      <MapPinIcon size={16} className="opacity-50" />
      <Autocomplete
        options={options}
        onValueChange={handleValueChange}
        onInputChange={handleInputChange}
        value={value}
        placeholder={appConfig.search?.locationInputPlaceholder}
      />
    </div>
  );
}
