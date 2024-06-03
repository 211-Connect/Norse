import { serverSideAppConfig } from '@/lib/server-utils';
import { BaseSearchAdapter } from './BaseSearchAdapter';
import { ElasticsearchSearchAdapter } from './ElasticsearchSearchAdapter';

// Supported search engines
// We might be able to add postgres here in the future for a very "basic" search option
// this would be a cheaper alternative for those who don't want to host an instance of elasticsearch
const searchMapping = {
  elasticsearch: ElasticsearchSearchAdapter,
};

// Function to get the adapter with the correct return type
export async function getSearchAdapter() {
  const { appConfig } = await serverSideAppConfig();

  if (appConfig?.adapters?.search == null)
    throw new Error(
      'Search adapter is required. Please set one in your appConfig',
    );

  const AdapterClass = searchMapping[appConfig.adapters.search];

  if (!AdapterClass)
    throw new Error(
      `An adapter with name ${appConfig.adapters.search} was not found!`,
    );

  return new AdapterClass() as BaseSearchAdapter;
}
