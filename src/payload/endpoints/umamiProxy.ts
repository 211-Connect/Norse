import type { Endpoint } from 'payload';

import { getUmamiToken } from '../utilities/umamiAuth';

const ALLOWED_ENDPOINTS = [
  'stats',
  'pageviews',
  'metrics',
  'active',
  'events/series',
  'sessions',
  'metrics/expanded',
] as const;

const ALLOWED_PARAMS = [
  'startAt',
  'endAt',
  'unit',
  'timezone',
  'type',
  'limit',
  'eventName',
] as const;

export const umamiProxy: Endpoint = {
  path: '/umami-proxy',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const umamiApiUrl = process.env.UMAMI_API_URL;

    if (!umamiApiUrl) {
      return Response.json(
        {
          error:
            'Umami is not configured. Please set UMAMI_API_URL, UMAMI_USERNAME and UMAMI_PASSWORD environment variables.',
        },
        { status: 503 },
      );
    }

    const { query } = req;
    const endpoint = query?.endpoint as string | undefined;

    if (
      !endpoint ||
      !(ALLOWED_ENDPOINTS as ReadonlyArray<string>).includes(endpoint)
    ) {
      return Response.json(
        { error: 'Invalid endpoint parameter' },
        { status: 400 },
      );
    }

    const forwardedParams = new URLSearchParams();
    for (const param of ALLOWED_PARAMS) {
      const value = query?.[param] as string | undefined;
      if (value) forwardedParams.set(param, value);
    }

    // Resolve Umami website ID from the tenant passed by the client,
    // fall back to the user's first tenant, then to the env var.
    let umamiWebsiteId: string | undefined;
    const tenantId = query?.tenantId as string | undefined;

    if (tenantId) {
      try {
        const tenant = await req.payload.findByID({
          collection: 'tenants',
          id: tenantId,
          overrideAccess: true,
        });
        umamiWebsiteId = tenant.common?.umamiWebsiteId ?? undefined;
      } catch (err) {
        console.warn(`[umamiProxy] Failed to look up tenant "${tenantId}".`);
      }
    }

    if (!umamiWebsiteId) {
      return Response.json(
        { error: 'No Umami website ID configured for this tenant.' },
        { status: 503 },
      );
    }

    const apiPath = `/api/websites/${umamiWebsiteId}/${endpoint}`;
    const qs = forwardedParams.toString();
    const targetUrl = `${umamiApiUrl}${apiPath}${qs ? `?${qs}` : ''}`;

    let token: string;
    try {
      token = await getUmamiToken(umamiApiUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Umami authentication failed', detail: message },
        { status: 502 },
      );
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const body = await response.text();
        return Response.json(
          { error: 'Umami API error', detail: body },
          { status: response.status },
        );
      }

      const data = await response.json();
      return Response.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return Response.json(
        { error: 'Failed to reach Umami API', detail: message },
        { status: 502 },
      );
    }
  },
};
