import type { Endpoint, PayloadRequest } from 'payload';

import {
  enableScorecard,
  getScorecard,
  searchTaxonomies,
  updateScorecard,
} from '@/payload/utilities/taxonomyScorecardsApi';
import { findResourceDirectoryByTenantId } from '@/payload/collections/ResourceDirectories/actions/findResourceDirectoryByTenantId';
import {
  isSuperAdmin,
  isSupport,
} from '@/payload/collections/Users/access/roles';

type AuthorizedContext = {
  tenantId: string;
};

function toStringValue(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getTenantIdFromReq(req: PayloadRequest): string | null {
  const fromQuery = toStringValue(req.query?.tenantId);
  if (fromQuery) {
    return fromQuery;
  }

  return null;
}

function getPathParam(req: PayloadRequest, key: string): string | null {
  const routeParams = req.routeParams as Record<string, unknown> | undefined;
  return toStringValue(routeParams?.[key]);
}

function isInternalUser(req: PayloadRequest): boolean {
  return isSuperAdmin(req.user) || isSupport(req.user as any);
}

async function assertAuthorizedAndEnabled(
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

  const resourceDirectory = await findResourceDirectoryByTenantId(tenantId);
  const aiClassificationEnabled =
    resourceDirectory?.search?.searchSettings?.aiClassificationEnabled === true;

  if (!aiClassificationEnabled) {
    throw new Response(
      JSON.stringify({
        error:
          'AI classification is disabled for this tenant. Enable it in Search Settings first.',
        code: 'AI_CLASSIFICATION_DISABLED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return { tenantId };
}

function toNorseErrorResponse(error: unknown): Response {
  if (error instanceof Response) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  return Response.json({ error: message }, { status: 502 });
}

function parseWeights(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const out: Record<string, number> = {};

  for (const [rawCode, rawWeight] of Object.entries(value)) {
    const code = rawCode.trim();
    if (!code) {
      return null;
    }

    if (typeof rawWeight !== 'number' || !Number.isFinite(rawWeight)) {
      return null;
    }

    if (rawWeight < 0 || rawWeight > 1) {
      return null;
    }

    out[code] = rawWeight;
  }

  return out;
}

export const taxonomyScorecardsStatus: Endpoint = {
  path: '/taxonomy-scorecards/status',
  method: 'get',
  handler: async (req) => {
    try {
      if (!req.user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!isInternalUser(req)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }

      const tenantId = getTenantIdFromReq(req);
      if (!tenantId) {
        return Response.json(
          { error: 'Missing tenantId parameter.' },
          { status: 400 },
        );
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
        return Response.json({ error: 'Tenant not found.' }, { status: 404 });
      }

      const resourceDirectory = await findResourceDirectoryByTenantId(tenantId);
      const aiClassificationEnabled =
        resourceDirectory?.search?.searchSettings?.aiClassificationEnabled ===
        true;

      return Response.json({
        tenantId,
        aiClassificationEnabled,
      });
    } catch (error) {
      return toNorseErrorResponse(error);
    }
  },
};

export const taxonomyScorecardsSearch: Endpoint = {
  path: '/taxonomy-scorecards/taxonomies',
  method: 'get',
  handler: async (req) => {
    try {
      const tenantId = getTenantIdFromReq(req);
      if (!tenantId) {
        return Response.json(
          { error: 'Missing tenantId parameter.' },
          { status: 400 },
        );
      }

      await assertAuthorizedAndEnabled(req, tenantId);

      const query = toStringValue(req.query?.query) ?? '';
      const page = Number(req.query?.page ?? 1);
      const limit = Number(req.query?.limit ?? 20);

      const result = await searchTaxonomies({
        tenantId,
        query,
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
      });

      return Response.json(result);
    } catch (error) {
      return toNorseErrorResponse(error);
    }
  },
};

export const taxonomyScorecardsGet: Endpoint = {
  path: '/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode',
  method: 'get',
  handler: async (req) => {
    try {
      const tenantId = getPathParam(req, 'tenantId');
      const hsisCode = getPathParam(req, 'hsisCode');

      if (!tenantId || !hsisCode) {
        return Response.json(
          { error: 'Missing tenantId or hsisCode path parameter.' },
          { status: 400 },
        );
      }

      await assertAuthorizedAndEnabled(req, tenantId);

      const result = await getScorecard({ tenantId, hsisCode });
      return Response.json(result);
    } catch (error) {
      return toNorseErrorResponse(error);
    }
  },
};

export const taxonomyScorecardsUpdate: Endpoint = {
  path: '/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode',
  method: 'put',
  handler: async (req) => {
    try {
      const tenantId = getPathParam(req, 'tenantId');
      const hsisCode = getPathParam(req, 'hsisCode');

      if (!tenantId || !hsisCode) {
        return Response.json(
          { error: 'Missing tenantId or hsisCode path parameter.' },
          { status: 400 },
        );
      }

      await assertAuthorizedAndEnabled(req, tenantId);

      const body =
        ((await req.json?.()) as Record<string, unknown> | undefined) ?? {};
      const weights = parseWeights(body.weights);

      if (!weights) {
        return Response.json(
          {
            error:
              'Invalid weights. Provide an object of { needCode: number } with finite values between 0 and 1.',
          },
          { status: 400 },
        );
      }

      const includeChildren =
        typeof body.include_children === 'boolean'
          ? body.include_children
          : undefined;
      const includeSiblings =
        typeof body.include_siblings === 'boolean'
          ? body.include_siblings
          : undefined;
      const draft =
        typeof req.query?.draft === 'string'
          ? req.query.draft.trim().toLowerCase() === 'true'
          : false;

      const result = await updateScorecard({
        tenantId,
        hsisCode,
        body: {
          weights,
          include_children: includeChildren,
          include_siblings: includeSiblings,
          draft,
        },
      });

      return Response.json(result);
    } catch (error) {
      return toNorseErrorResponse(error);
    }
  },
};

export const taxonomyScorecardsEnable: Endpoint = {
  path: '/taxonomy-scorecards/tenants/:tenantId/taxonomies/:hsisCode/enable',
  method: 'post',
  handler: async (req) => {
    try {
      const tenantId = getPathParam(req, 'tenantId');
      const hsisCode = getPathParam(req, 'hsisCode');

      if (!tenantId || !hsisCode) {
        return Response.json(
          { error: 'Missing tenantId or hsisCode path parameter.' },
          { status: 400 },
        );
      }

      await assertAuthorizedAndEnabled(req, tenantId);

      const body =
        ((await req.json?.()) as Record<string, unknown> | undefined) ?? {};
      const versionIdRaw = body.version_id;
      const versionId =
        typeof versionIdRaw === 'number'
          ? versionIdRaw
          : typeof versionIdRaw === 'string' && versionIdRaw.trim()
            ? Number(versionIdRaw)
            : NaN;

      if (!Number.isInteger(versionId)) {
        return Response.json({ error: 'Missing version_id.' }, { status: 400 });
      }

      const result = await enableScorecard({
        tenantId,
        hsisCode,
        body: {
          version_id: versionId,
        },
      });

      return Response.json(result);
    } catch (error) {
      return toNorseErrorResponse(error);
    }
  },
};
