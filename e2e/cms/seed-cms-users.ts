/**
 * Creates (or resets) the local Payload CMS e2e users from `./users.ts`: a
 * super-admin, and a tenant-admin and a tenant-editor on one tenant. LOCAL
 * databases only — it refuses any other `DATABASE_URI`:
 *
 *   npm run test:e2e:cms:seed
 *
 * The tenant is `E2E_CMS_TENANT_ID`, else the first tenant (by Settings
 * name) that has a Settings document.
 */
import config from '@payload-config';
import { getPayload } from 'payload';

import { CMS_E2E_USERS } from './users';

const LOCAL_DB_HOST = /@(localhost|127\.0\.0\.1|norse-db)(:\d+)?\//;

async function main() {
  if (!LOCAL_DB_HOST.test(process.env.DATABASE_URI ?? '')) {
    throw new Error(
      'Refusing to seed CMS e2e users: DATABASE_URI is not a local database.',
    );
  }

  const payload = await getPayload({ config });

  let tenantId = process.env.E2E_CMS_TENANT_ID;
  if (!tenantId) {
    const settings = await payload.find({
      collection: 'resource-directories',
      depth: 0,
      limit: 1,
      sort: 'name',
      select: { tenant: true },
    });
    const tenant = settings.docs[0]?.tenant;
    tenantId = typeof tenant === 'string' ? tenant : tenant?.id;
  }
  if (!tenantId) {
    throw new Error('No tenant with a Settings document found.');
  }

  for (const user of Object.values(CMS_E2E_USERS)) {
    const data = {
      email: user.email,
      password: user.password,
      roles: [user.role],
      tenants: user.tenantRole
        ? [{ tenant: tenantId, roles: [user.tenantRole] }]
        : [],
    };
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: user.email } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: 'users',
        id: existing.docs[0].id,
        data,
      });
    } else {
      await payload.create({ collection: 'users', data });
    }
    payload.logger.info(
      `CMS e2e user ${user.email}: ${user.tenantRole ?? user.role}` +
        (user.tenantRole ? ` on tenant ${tenantId}` : ''),
    );
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
