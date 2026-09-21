import type { PayloadRequest } from 'payload';

import {
  isSuperAdmin,
  isSupport,
} from '@/payload/collections/Users/access/roles';

type AuthorizedContext = {
  tenantId: string;
};

function isInternalUser(req: PayloadRequest): boolean {
  return isSuperAdmin(req.user) || isSupport(req.user as any);
}

export { isInternalUser };

export async function assertAuthorized(
  req: PayloadRequest,
  tenantId: string,
): Promise<AuthorizedContext> {
  if (!req.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isInternalUser(req)) {
    throw new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let tenantExists = true;
  try {
    await req.payload.findByID({
      collection: 'tenants',
      id: tenantId,
      overrideAccess: true,
    });
  } catch {
    tenantExists = false;
  }

  if (!tenantExists) {
    throw new Response(JSON.stringify({ error: 'Tenant not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { tenantId };
}
