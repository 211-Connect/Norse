import { serverSideAppConfig } from '@/lib/server/utils';
import { BaseSearchAdapter } from './BaseSearchAdapter';
import { ElasticsearchSearchAdapter } from './ElasticsearchSearchAdapter';

const searchMapping = {
  elasticsearch: ElasticsearchSearchAdapter,
};

// Function to get the adapter with the correct return type
export async function getSearchAdapter() {
  const { appConfig } = await serverSideAppConfig();

  const AdapterClass = searchMapping[appConfig.adapters.search];
  return new AdapterClass() as BaseSearchAdapter;
}
