import { Endpoint } from 'payload';
import { addLocalAdmin } from './admin';
import { addTenants } from './tenants';

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
      console.error('Error during seeding:', error);
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
      console.error('Error adding local admin:', error);
      throw error;
    }

    return Response.json({ status: 'local admin added' }, { status: 200 });
  },
};
