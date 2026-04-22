import type { CollectionAfterChangeHook } from 'payload';

import type { Tenant } from '../../../payload-types';
import { getUmamiToken } from '../../../utilities/umamiAuth';

async function verifyUmamiTeam(
  umamiApiUrl: string,
  teamId: string,
  token: string,
): Promise<boolean> {
  const res = await fetch(`${umamiApiUrl}/api/teams/${teamId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    console.warn(
      `[createUmamiWebsite] Team "${teamId}" not found or inaccessible (${res.status}). Skipping website creation.`,
    );
    return false;
  }

  return true;
}

async function createUmamiWebsiteRequest(
  umamiApiUrl: string,
  teamId: string,
  token: string,
  name: string,
  domain: string,
): Promise<string | null> {
  const res = await fetch(`${umamiApiUrl}/api/websites`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ name, domain, teamId }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[createUmamiWebsite] Failed to create Umami website (${res.status}): ${body}`,
    );
    return null;
  }

  const created = (await res.json()) as { id?: string };

  if (!created.id) {
    console.error(
      '[createUmamiWebsite] Umami create-website response did not include an id.',
    );
    return null;
  }

  console.log(
    `[createUmamiWebsite] Successfully created Umami website with id "${created.id}" for tenant "${name}".`,
  );
  return created.id;
}

export const createUmamiWebsite: CollectionAfterChangeHook<Tenant> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc;
  if (doc.common?.umamiWebsiteId) return doc;

  const umamiApiUrl = process.env.UMAMI_API_URL;
  const teamId = process.env.UMAMI_TEAM_ID;

  if (!umamiApiUrl || !teamId) {
    console.warn(
      '[createUmamiWebsite] Skipping: UMAMI_API_URL or UMAMI_TEAM_ID is not set.',
    );
    return doc;
  }

  try {
    const token = await getUmamiToken(umamiApiUrl);

    const teamExists = await verifyUmamiTeam(umamiApiUrl, teamId, token);
    if (!teamExists) return doc;

    const domain = doc.trustedDomains?.[0]?.domain ?? '';
    const websiteId = await createUmamiWebsiteRequest(
      umamiApiUrl,
      teamId,
      token,
      doc.name,
      domain,
    );

    if (!websiteId) return doc;

    await req.payload.update({
      collection: 'tenants',
      id: doc.id,
      data: {
        common: {
          umamiWebsiteId: websiteId,
        },
      },
      overrideAccess: true,
      req,
    });

    return {
      ...doc,
      common: {
        ...doc.common,
        umamiWebsiteId: websiteId,
      },
    };
  } catch (err) {
    console.error('[createUmamiWebsite] Unexpected error:', err);
    return doc;
  }
};
