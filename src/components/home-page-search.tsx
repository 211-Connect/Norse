import { useRouter } from 'next/router';
import qs from 'qs';
import { LocationAutocomplete } from './location-autocomplete';
// import { TaxonomyAutocomplete } from './TaxonomyAutocomplete';
import { useTranslation } from 'next-i18next';
import { useAppConfig } from '../lib/hooks/use-app-config';
import { Button } from './ui/button';
import Autocomplete from './ui/autocomplete';
import Search from './search/index';

export function HomePageSearch() {
  const router = useRouter();
  const { t } = useTranslation('common');
  const appConfig = useAppConfig();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const urlParams: any = {};

    const query = formData.get('query') as string;
    if (query) {
      urlParams.query = query;
    }

    const queryLabel = formData.get('query_label') as string;
    if (queryLabel) {
      urlParams.query_label = queryLabel;
    }

    const queryType = formData.get('query_type') as string;
    if (queryType) {
      urlParams.query_type = queryType;
    }

    const location = formData.get('location') as string;
    const coordinates = formData.get('coords') as string;
    const radius = formData.get('radius') as string;

    if (
      typeof location === 'string' &&
      location.length > 0 &&
      coordinates == null
    ) {
      const res = await fetch(`/api/geocode?address=${location}`);
      const data = await res.json();
      urlParams.location = data.address;
      urlParams.coords = data.coords;
      urlParams.distance = radius || 0;
    } else if (
      typeof location === 'string' &&
      location.length > 0 &&
      typeof coordinates === 'string' &&
      coordinates.length > 0
    ) {
      urlParams.location = location;
      urlParams.coords = coordinates;
      urlParams.distance = radius || 0;
    }

    await router.push(`/search?${qs.stringify(urlParams)}`);
  };

  return (
    <Search />
    // <form method="get" action="/search" onSubmit={handleSubmit}>
    //   <div className="flex justify-end">
    //     {/* <TaxonomyAutocomplete
    //       className="search-box"
    //       defaultValue={
    //         (router.query?.query_label as string) ??
    //         (router.query.query as string)
    //       }
    //       styles={{
    //         input: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
    //       }}
    //       size="md"
    //       w="100%"
    //       defaultQuery={router.query.query as string}
    //       defaultQueryLabel={router.query.query_label as string}
    //       defaultQueryType={router.query.query_type as string}
    //     /> */}

    //     <Button type="submit">{t('call_to_action.search')}</Button>
    //   </div>

    //   {appConfig?.pages?.home?.showLocationInput && (
    //     <LocationAutocomplete
    //       defaultValue={router.query.location as string}
    //       defaultCoords={router.query.coords as string}
    //     />
    //   )}
    // </form>
  );
}
