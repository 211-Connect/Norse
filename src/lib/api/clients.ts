import { API_URL } from '@/app/(app)/shared/lib/constants';
import { instrumentedApiFetch } from '@/lib/telemetry/api-fetch';

import { Analytics } from './generated/Analytics';
import { BlockedTrafficInternal } from './generated/BlockedTrafficInternal';
import { FavoriteList } from './generated/FavoriteList';
import { Favorite } from './generated/Favorite';
import { Geocoding } from './generated/Geocoding';
import { PrintableDirectories } from './generated/PrintableDirectories';
import { PrintableDirectoriesPublic } from './generated/PrintableDirectoriesPublic';
import { PrintableDirectoryDeliveries } from './generated/PrintableDirectoryDeliveries';
import { PrintableDirectoryDeliveriesInternal } from './generated/PrintableDirectoryDeliveriesInternal';
import { Resource } from './generated/Resource';
import { Search } from './generated/Search';
import { ShortUrl } from './generated/ShortUrl';
import { Suggestion } from './generated/Suggestion';
import { TaxonomyScorecard } from './generated/TaxonomyScorecard';

const baseArgs = {
  baseUrl: API_URL || '',
  baseApiParams: {
    headers: {
      'x-api-version': '1',
    },
  },
};

/** Generated clients share the base config but get their own instrumented fetch. */
const clientArgs = (clientName: string) => ({
  ...baseArgs,
  customFetch: instrumentedApiFetch(clientName),
});

export const analyticsApiClient = new Analytics(clientArgs('analytics'));

export const blockedTrafficInternalApiClient = new BlockedTrafficInternal(
  clientArgs('blocked-traffic-internal'),
);

export const searchApiClient = new Search(clientArgs('search'));

export const shortUrlApiClient = new ShortUrl(clientArgs('short-url'));

export const geocodingApiClient = new Geocoding(clientArgs('geocoding'));

export const printableDirectoriesApiClient = new PrintableDirectories(
  clientArgs('printable-directories'),
);

export const printableDirectoriesPublicApiClient =
  new PrintableDirectoriesPublic(clientArgs('printable-directories-public'));

export const printableDirectoryDeliveriesApiClient =
  new PrintableDirectoryDeliveries(clientArgs('printable-directory-deliveries'));

export const printableDirectoryDeliveriesInternalApiClient =
  new PrintableDirectoryDeliveriesInternal(
    clientArgs('printable-directory-deliveries-internal'),
  );

export const taxonomyScorecardApiClient = new TaxonomyScorecard(
  clientArgs('taxonomy-scorecard'),
);

export const favoriteListApiClient = new FavoriteList(clientArgs('favorite-list'));

export const favoriteApiClient = new Favorite(clientArgs('favorite'));

export const resourceApiClient = new Resource(clientArgs('resource'));

export const suggestionApiClient = new Suggestion(clientArgs('suggestion'));
