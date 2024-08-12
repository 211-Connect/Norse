import { useTranslation } from 'next-i18next';
import { Autocomplete } from '../autocomplete';

export function SearchBar() {
  const { t } = useTranslation();

  return (
    <form>
      <Autocomplete
        className="search-box"
        placeholder={
          t('search.query_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.query_placeholder'),
          }) || ''
        }
        options={[]}
        emptyMessage="Hello, world!"
      />

      <Autocomplete
        placeholder={
          t('search.location_placeholder', {
            ns: 'dynamic',
            defaultValue: t('search.location_placeholder'),
          }) || ''
        }
        options={[]}
        emptyMessage="Hello, world!"
      />
    </form>
  );
}
