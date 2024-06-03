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

  if (appConfig?.adapters?.database == null)
    throw new Error(
      'Database adapter is required. Please set one in your appConfig',
    );

  const AdapterClass = databaseMapping[appConfig.adapters.database];

  if (!AdapterClass)
    throw new Error(
      `An adapter with name ${appConfig.adapters.database} was not found!`,
    );

  return new AdapterClass() as BaseDatabaseAdapter;
}
