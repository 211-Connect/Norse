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

  const AdapterClass = searchMapping[appConfig.adapters.search];
  return new AdapterClass() as BaseSearchAdapter;
}
