import { useForm } from '@tanstack/react-form';
import TaxonomySearch from './components/taxonomy-input';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { Option } from '../ui/autocomplete';
import useSuggestions from '@/lib/hooks/use-suggestions';
import { isTaxonomyCode } from './adapters/taxonomy-adapter';
import { useRouter } from 'next/router';
import qs from 'qs';
import LocationInput from './components/location-input';

import { useAppConfig } from '@/lib/hooks/use-app-config';
import RadiusSelect from './components/radius-select';
import LocationAdapter from './adapters/location-adapter';
import { Badge } from '../ui/badge';

export default function Search() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const suggestions = useSuggestions();
  const appConfig = useAppConfig();

  const form = useForm({
    defaultValues: {
      taxonomy: '',
      location: '',
      query: (router.query?.query as string) ?? '',
      query_label: (router.query?.query_label as string) ?? '',
      query_type: (router.query?.query_type as string) ?? '',
      coords: '',
      radius:
        (router.query?.distance as string) ??
        appConfig?.search?.defaultRadius?.toString() ??
        '0',
    },
    async onSubmit({ value }) {
      const urlParams: {
        query?: string;
        query_label?: string;
        query_type?: string;
        location?: string;
        coords?: string;
        distance?: string;
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

      if (value.location.length > 0 && value.coords.length === 0) {
        const locationAdapter = LocationAdapter();
        const data = await locationAdapter.forwardGeocode(
          value.location,
          router.locale
        );
        console.log({ data });
        urlParams.location = data?.features?.[0]?.properties?.full_address;
        urlParams.coords = [
          data?.features?.[0]?.properties?.coordinates?.longitude,
          data?.features?.[0]?.properties?.coordinates?.latitude,
        ].join(',');
        urlParams.distance = value.radius || '0';
      } else if (value.location.length > 0 && value.coords.length > 0) {
        urlParams.location = value.location;
        urlParams.coords = value.coords;
        urlParams.distance = value.radius || '0';
      }

      await router.push(`/search?${qs.stringify(urlParams)}`);
    },
  });

  return (
    <form
      className="w-full flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="taxonomy">
        {(field) => (
          <TaxonomySearch
            name={field.name}
            onChange={(option: Option) => {
              field.handleChange(option.value);

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
              field.form.setFieldValue(
                'query_label',

                valueInSuggestions ? valueInSuggestions.value : option.value
              );
              field.form.setFieldValue(
                'query_type',
                valueInSuggestions ||
                  isTaxonomyCode.test(option.value) ||
                  option.term
                  ? 'taxonomy'
                  : 'text'
              );
            }}
          />
        )}
      </form.Field>

      {(appConfig?.pages?.home?.showLocationInput ||
        router.pathname.startsWith('/search')) && (
        <div className="flex items-start">
          <form.Field name="location">
            {(field) => (
              <LocationInput
                className="w-full"
                name={field.name}
                onChange={(option) => {
                  field.handleChange(option.value);
                  field.form.setFieldValue('coords', '');
                }}
                onCoordChange={(coords) => {
                  field.form.setFieldValue('coords', coords);
                }}
              />
            )}
          </form.Field>

          <form.Field name="radius">
            {(field) => (
              <RadiusSelect
                name={field.name}
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
              />
            )}
          </form.Field>
        </div>
      )}

      <form.Field name="query">
        {(field) => (
          <input
            hidden
            id={field.name}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="query_label">
        {(field) => (
          <input
            hidden
            id={field.name}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="query_type">
        {(field) => (
          <input
            hidden
            id={field.name}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="coords">
        {(field) => (
          <input
            hidden
            id={field.name}
            name={field.name}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <Button className="self-end" type="submit">
        {t('call_to_action.search')}
      </Button>

      {router.query.query_type === 'taxonomy' &&
        router.query.query.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {router.query.query_type === 'taxonomy'
              ? (router.query?.query as string)
                  ?.split(',')
                  .map((value) => <Badge key={value}>{value}</Badge>)
              : null}
          </div>
        )}
    </form>
  );
}
