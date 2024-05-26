import { useForm } from '@tanstack/react-form';
import TaxonomySearch from './taxonomy-input';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { Option } from '../ui/autocomplete';
import useSuggestions from '@/lib/hooks/use-suggestions';
import { isTaxonomyCode } from './adapters/taxonomy-adapter';
import { useRouter } from 'next/router';
import qs from 'qs';
import LocationInput from './location-input';

export default function Search() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const suggestions = useSuggestions();

  const form = useForm({
    defaultValues: {
      taxonomy: '',
      query: '',
      query_label: '',
      query_type: '',
    },
    async onSubmit({ value }) {
      const urlParams: {
        query?: string;
        query_label?: string;
        query_type?: string;
      } = {};

      if (value.query && value.query.length > 0) {
        urlParams.query = value.query;
      }

      if (value.query_label && value.query_label.length > 0) {
        urlParams.query_label = value.query_label;
      }

      if (value.query_type && value.query_type.length > 0) {
        urlParams.query_type = value.query_type;
      }
      await router.push(`/search?${qs.stringify(urlParams)}`);
    },
  });

  return (
    <form
      className="w-full flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="taxonomy"
        children={(field) => (
          <TaxonomySearch
            name={field.name}
            onChange={(option: Option) => {
              const valueInSuggestions = suggestions.find(
                (s) =>
                  s.value.toLowerCase() === option.value.toLowerCase() ||
                  s.term.toLowerCase().startsWith(option.value.toLowerCase())
              );

              field.form.setFieldValue(
                'query',
                valueInSuggestions
                  ? valueInSuggestions.term
                  : option?.term ?? option.value
              );
              field.form.setFieldValue('query_label', option.value);
              field.form.setFieldValue(
                'query_type',
                valueInSuggestions ||
                  isTaxonomyCode.test(option.value) ||
                  option.term
                  ? 'taxonomy'
                  : 'text'
              );

              field.handleChange(option.value);
            }}
          />
        )}
      />

      <LocationInput />

      <input hidden name="query" defaultValue={router.query.query} />
      <input
        hidden
        name="query_label"
        defaultValue={router.query.query_label}
      />
      <input hidden name="query_type" defaultValue={router.query.query_type} />

      <Button type="submit">{t('call_to_action.search')}</Button>
    </form>
  );
}
