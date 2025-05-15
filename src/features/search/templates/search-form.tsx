import { useForm } from 'react-hook-form';
import { SearchBar } from '../components/search-bar';

export function SearchForm() {
  const form = useForm();

  return (
    <form>
      <SearchBar />
    </form>
  );
}
