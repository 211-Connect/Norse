import { Endpoint } from 'payload';
import { addLocalAdmin } from './admin';
import { addTenants } from './tenants';
import { createLogger } from '@/lib/logger';

const log = createLogger('seed');

export const seedEndpoint: Endpoint = {
  path: '/seed',
  method: 'get',
  handler: async ({ payload, query }) => {
    if (query.secret !== process.env.STRAPI_TOKEN) {
      return Response.json({ status: 'unauthorized' }, { status: 401 });
    }

    const requestedTenants = query.tenant
      ? Array.isArray(query.tenant)
        ? query.tenant
        : [query.tenant]
      : undefined;

    try {
      await addTenants(payload, requestedTenants);
    } catch (error) {
      log.error({ err: error }, 'Error during seeding');
      throw error;
    }

    return Response.json({ status: 'done' }, { status: 200 });
  },
};

export const addLocalAdminEndpoint: Endpoint = {
  path: '/seed-local-admin',
  method: 'get',
  handler: async ({ payload }) => {
    try {
      await addLocalAdmin(payload);
    } catch (error) {
      log.error({ err: error }, 'Error adding local admin');
      throw error;
    }

    return Response.json({ status: 'local admin added' }, { status: 200 });
  },
};
