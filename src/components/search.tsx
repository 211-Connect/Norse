import { useRouter } from 'next/router';
import qs from 'qs';
import { LocationAutocomplete } from './location-autocomplete';
import { useTranslation } from 'next-i18next';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

type Props = {
  hideLocation?: boolean;
};

export function Search({ hideLocation }: Props) {
  const router = useRouter();
  const { t } = useTranslation('common');

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
    <div className="flex flex-col gap-2 w-full">
      <form method="get" action="/search" onSubmit={handleSubmit}>
        <div className="flex">
          {/* <TaxonomyAutocomplete
            className="search-box"
            defaultValue={
              (router.query?.query_label as string) ??
              (router.query.query as string)
            }
            labelProps={{
              sx: (t: any) => ({
                fontSize: t.headings.sizes.h3.fontSize,
              }),
            }}
            styles={{
              input: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
            }}
            size="md"
            w="100%"
            defaultQuery={router.query.query as string}
            defaultQueryLabel={router.query.query_label as string}
            defaultQueryType={router.query.query_type as string}
          /> */}

          <Button
            className="rounded-tl-none rounded-bl-none"
            size="lg"
            type="submit"
          >
            {t('call_to_action.search')}
          </Button>
        </div>

        {!hideLocation && (
          <LocationAutocomplete
            defaultValue={router.query.location as string}
            defaultCoords={router.query.coords as string}
          />
        )}
      </form>

      {router.query.query_type === 'taxonomy' && (
        <div className="flex gap-1 items-center flex-wrap">
          {(router.query.query as string)?.split(',').map((query) => (
            <Badge key={query} variant="secondary">
              {query}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
