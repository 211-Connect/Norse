import { Analytics } from './generated/Analytics';
import { Geocoding } from './generated/Geocoding';
import { PrintableDirectories } from './generated/PrintableDirectories';
import { Search } from './generated/Search';
import { TaxonomyScorecard } from './generated/TaxonomyScorecard';
import { API_URL, INTERNAL_API_KEY } from '@/app/(app)/shared/lib/constants';

const clientArgs = {
  baseUrl: API_URL || '',
  baseApiParams: {
    headers: {
      'x-api-version': '1',
      'x-internal-api-key': INTERNAL_API_KEY || '',
    },
  },
};

export const analyticsApiClient = new Analytics(clientArgs);

export const searchApiClient = new Search(clientArgs);

export const geocodingApiClient = new Geocoding(clientArgs);

export const printableDirectoriesApiClient = new PrintableDirectories(
  clientArgs,
);

export const taxonomyScorecardApiClient = new TaxonomyScorecard(clientArgs);
