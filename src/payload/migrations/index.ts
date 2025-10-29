import { Endpoint } from 'payload';
import { addLocalAdmin } from './admin';
import { addTenants } from './tenants';

export const seedEndpoint: Endpoint = {
  path: '/seed',
  method: 'get',
  handler: async ({ payload }) => {
    try {
      await addLocalAdmin(payload);
      await addTenants(payload);
    } catch (error) {
      console.error('Error during seeding:', error);
      throw error;
    }

    return Response.json({ status: 'done' }, { status: 200 });
  },
};
