import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { AddressBar } from '../components/address-bar';
import { SearchBar } from '../components/search-bar';

export function SearchForm() {
  const t = useTranslations('common');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('submitted');
  };

  return (
    <form className="w-full space-y-2" onSubmit={handleSubmit}>
      <SearchBar />
      <AddressBar />
      <div className="flex justify-end">
        <Button>{t('search.search')}</Button>
      </div>
    </form>
  );
}
