import { MapPinIcon } from 'lucide-react';
import { useAddresses } from './hooks/use-addresses';
import { Autocomplete } from '@/components/autocomplete';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useOptions } from './hooks/use-options';
import { useLocationStore } from '@/lib/context/location-context/location-store-provider';

export function AddressBar() {
  const appConfig = useAppConfig();
  const { setInputValue, selectedValue, setSelectedValue } = useLocationStore(
    (store) => ({
      selectedValue: store.selectedValue,
      setInputValue: store.setSearchTerm,
      setSelectedValue: store.setSelectedValue,
    }),
  );
  const { data: addresses } = useAddresses();

  const options = useOptions({ addresses });

  return (
    <div className="flex w-full items-center space-x-2 border-b">
      <MapPinIcon size={16} className="opacity-50" />
      <Autocomplete
        options={options}
        onInputChange={setInputValue}
        placeholder={appConfig.search?.locationInputPlaceholder}
        onValueChange={setSelectedValue}
        value={selectedValue}
      />
    </div>
  );
}
