import { useForm } from 'react-hook-form';
import { SearchBar } from '../components/search-bar';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function SearchForm() {
  const form = useForm();

  const handleSubmit = (values) => {};

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search</FormLabel>
              <SearchBar />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
