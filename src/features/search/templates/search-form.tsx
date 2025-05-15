import { useForm } from 'react-hook-form';
import { SearchBar } from '../components/search-bar';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';

export function SearchForm() {
  const form = useForm();

  const handleSubmit = (values) => {};

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full space-y-2"
      >
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <SearchBar />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button>Search</Button>
        </div>
      </form>
    </Form>
  );
}
