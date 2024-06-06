import { useForm } from '@tanstack/react-form';
import TaxonomySearch from './components/taxonomy-input';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { Option } from '../ui/autocomplete';
import useSuggestions from './hooks/use-suggestions';
import { isTaxonomyCode } from './adapters/taxonomy-adapter';
import { useRouter } from 'next/router';
import LocationInput, { locationAtom } from './components/location-input';
import { useAppConfig } from '@/hooks/use-app-config';
import RadiusSelect from './components/radius-select';
import LocationAdapter from './adapters/location-adapter';
import { Badge } from '../ui/badge';
import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { isNil, omit, omitBy } from 'lodash';

export default function Search() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const suggestions = useSuggestions();
  const appConfig = useAppConfig();
  const [location, setLocation] = useAtom(locationAtom);

  const form = useForm({
    defaultValues: {
      taxonomy:
        (router.query?.query_label as string) ??
        (router.query?.query as string) ??
        '',
      location: location?.value ?? '',
      query: (router.query?.query as string) ?? '',
      query_label: (router.query?.query_label as string) ?? '',
      query_type: (router.query?.query_type as string) ?? '',
      radius:
        (router.query?.distance as string) ??
        appConfig?.features?.search?.defaultRadius?.toString() ??
        '0',
    },
    async onSubmit({ value }) {
      let urlParams: {
        query?: string;
        query_label?: string;
        query_type?: string;
        location?: string;
        coords?: string;
        distance?: string;
      } = {
        ...router.query,
      };

      if (value.query && value.query.length > 0) {
        urlParams.query = value.query;
      } else {
        urlParams = omit(urlParams, ['query']);
      }

      if (value.query_label && value.query_label.length > 0) {
        urlParams.query_label = value.query_label;
      } else {
        urlParams = omit(urlParams, ['query_label']);
      }

      if (
        value.query_type &&
        value.query_type.length > 0 &&
        value.query.length > 0
      ) {
        urlParams.query_type = value.query_type;
      } else {
        urlParams = omit(urlParams, ['query_type']);
      }

      if (value.location.length > 0 && location.coords.length === 0) {
        const locationAdapter = LocationAdapter();
        const data = await locationAdapter.forwardGeocode(
          value.location,
          router.locale,
        );
        setLocation({
          value: data?.features?.[0]?.properties?.full_address,
          coords: [
            data?.features?.[0]?.properties?.coordinates?.longitude,
            data?.features?.[0]?.properties?.coordinates?.latitude,
          ].join(','),
        });
        urlParams.location = data?.features?.[0]?.properties?.full_address;
        urlParams.coords = [
          data?.features?.[0]?.properties?.coordinates?.longitude,
          data?.features?.[0]?.properties?.coordinates?.latitude,
        ].join(',');
        urlParams.distance = value.radius || '0';
      } else if (value.location.length > 0 && location.coords.length > 0) {
        urlParams.location = value.location;
        urlParams.coords = location.coords;
        urlParams.distance = value.radius || '0';
      } else {
        urlParams = omit(urlParams, ['location', 'coords', 'distance']);
      }

      urlParams = omitBy(urlParams, (value) => isNil(value) || value === '');

      await router.push({
        pathname: '/search',
        query: urlParams,
      });
    },
  });

  // Keep form data in sync
  useEffect(() => {
    form.setFieldValue('location', location.value);
  }, [location.value, form]);

  return (
    <form
      className="flex w-full flex-col gap-2"
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
            value={field.state.value}
            onInputChange={(value) => {
              field.handleChange(value);

              const valueInSuggestions = suggestions.find(
                (s) =>
                  s.value.toLowerCase() === value.toLowerCase() ||
                  s.term.toLowerCase() === value.toLowerCase(),
              );

              field.form.setFieldValue(
                'query',
                valueInSuggestions ? valueInSuggestions.term : value,
              );
              field.form.setFieldValue(
                'query_label',
                valueInSuggestions ? valueInSuggestions.value : value,
              );
              field.form.setFieldValue(
                'query_type',
                valueInSuggestions || isTaxonomyCode.test(value)
                  ? 'taxonomy'
                  : 'text',
              );
            }}
            onValueSelect={(option: Option) => {
              field.handleChange(option.value);

              const valueInSuggestions = suggestions.find(
                (s) =>
                  s.value.toLowerCase() === option.value.toLowerCase() ||
                  s.term.toLowerCase() === option.value.toLowerCase(),
              );

              field.form.setFieldValue(
                'query',
                valueInSuggestions
                  ? valueInSuggestions.term
                  : option?.term ?? option.value,
              );
              field.form.setFieldValue(
                'query_label',
                valueInSuggestions ? valueInSuggestions.value : option.value,
              );
              field.form.setFieldValue(
                'query_type',
                valueInSuggestions ||
                  isTaxonomyCode.test(option.value) ||
                  option.term
                  ? 'taxonomy'
                  : 'text',
              );
            }}
          />
        )}
      </form.Field>

      {(!appConfig?.pages?.home?.hideLocationInput ||
        router.pathname.startsWith('/search')) && (
        <div className="flex items-start">
          <form.Field name="location">
            {(field) => <LocationInput className="w-full" name={field.name} />}
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

      <Button className="self-end" type="submit" variant="secondary">
        {t('call_to_action.search')}
      </Button>

      {router.query.query_type === 'taxonomy' &&
        router.query.query.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {router.query.query_type === 'taxonomy'
              ? (router.query?.query as string)?.split(',').map((value) => (
                  <Badge key={value} variant="outline">
                    {value}
                  </Badge>
                ))
              : null}
          </div>
        )}
    </form>
  );
}
