import { useTranslation } from 'next-i18next';
import { MapPin } from 'lucide-react';
import { Autocomplete } from './autocomplete';
import { useMapAdapter } from '../hooks/use-map-adapter';

export function LocationSearchBar() {
  const { t } = useTranslation();
  const adapter = useMapAdapter();

  return (
    <Autocomplete
      className="search-box"
      placeholder={
        t('search.location_placeholder', {
          ns: 'dynamic',
          defaultValue: t('search.location_placeholder'),
        }) || ''
      }
      options={[]}
      emptyMessage="No results..."
      Icon={MapPin}
      // onInputChange={}
      // value={searchTerm}
    />
  );
}
