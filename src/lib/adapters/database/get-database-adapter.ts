import { MongoDatabaseAdapter } from './MongoDatabaseAdapter';
import { PostgresDatabaseAdapter } from './PostgresDatabaseAdapter';
import { serverSideAppConfig } from '@/lib/server-utils';
import { BaseDatabaseAdapter } from './BaseDatabaseAdapter';

// Supported databases
const databaseMapping = {
  mongodb: MongoDatabaseAdapter,
  postgres: PostgresDatabaseAdapter,
};

// Function to get the adapter with the correct return type
export async function getDatabaseAdapter() {
  const { appConfig } = await serverSideAppConfig();

  const AdapterClass = databaseMapping[appConfig.adapters.database];
  return new AdapterClass() as BaseDatabaseAdapter;
}
