import { MapPinIcon } from 'lucide-react';
import { useAddresses } from './hooks/use-addresses';
import { Autocomplete } from '@/components/autocomplete';
import { useAppConfig } from '@/lib/context/app-config-context';
import { useOptions } from './hooks/use-options';
import { useLocationStore } from '@/lib/context/location-context/location-store-provider';

export function AddressBar() {
  const appConfig = useAppConfig();
  const { setInputValue, selectedValue, setSelectedValue, setUserCoords } =
    useLocationStore((store) => ({
      selectedValue: store.selectedValue,
      setInputValue: store.setSearchTerm,
      setSelectedValue: store.setSelectedValue,
      setUserCoords: store.setUserCoords,
    }));
  const { data: addresses } = useAddresses();

  const options = useOptions({ addresses });

  const handleOnValueChange = (newValue: string) => {
    setSelectedValue(newValue);

    const address = addresses.find(
      (address) => address.address.toLowerCase() === newValue.toLowerCase(),
    );
    if (address) {
      setUserCoords(address.coordinates);
    } else {
      setUserCoords(undefined);
    }
  };

  return (
    <div className="flex w-full items-center space-x-2 border-b">
      <MapPinIcon size={16} className="opacity-50" />
      <Autocomplete
        options={options}
        onInputChange={setInputValue}
        placeholder={appConfig.search?.locationInputPlaceholder}
        onValueChange={handleOnValueChange}
        value={selectedValue}
      />
    </div>
  );
}
