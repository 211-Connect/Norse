import { createLogger } from '@/lib/logger';
import { getPayloadSingleton } from '@/payload/getPayloadSingleton';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const log = createLogger('keycloak:domain-check');

/**
 * POST /api/keycloak/domain-check
 *
 * Called by the Keycloak DomainValidatorAuthenticator SPI during login.
 * Checks whether the supplied email domain is on the allow-list for the
 * given realm (tenant).
 *
 * Request body:
 *   { "domain": "acme.com", "realmId": "tenant-abc" }
 *
 * Authorization:
 *   Bearer <KEYCLOAK_INTERNAL_SECRET>
 *
 * Responses:
 *   200 — domain is allowed, login may proceed
 *   401 — missing or invalid shared secret
 *   400 — missing domain or realmId in request body
 *   404 — no tenant found for the given realmId
 *   403 — domain is not on the allow-list for this tenant
 */
export async function POST(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.KEYCLOAK_INTERNAL_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new NextResponse(null, { status: 401 });
  }

  let domain: string;
  let realmId: string;

  try {
    const body = await req.json();
    domain = (body?.domain ?? '').toString().toLowerCase().trim();
    realmId = (body?.realmId ?? '').toString().trim();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (!domain || !realmId) {
    return new NextResponse(null, { status: 400 });
  }

  const payload = await getPayloadSingleton();

  const { docs } = await payload.find({
    collection: 'tenants',
    where: { 'auth.realmId': { equals: realmId } },
    limit: 1,
    pagination: false,
  });

  const tenant = docs[0];

  if (!tenant) {
    log.warn({ realmId }, 'domain-check: no tenant found for realmId');
    return new NextResponse(null, { status: 404 });
  }

  const allowedDomains: { domain: string }[] =
    tenant.auth?.allowedEmailDomains ?? [];
  const allowed = allowedDomains.some(
    (entry) => entry.domain.toLowerCase().trim() === domain,
  );

  if (allowed) {
    return new NextResponse(null, { status: 200 });
  }

  return new NextResponse(null, { status: 403 });
}
