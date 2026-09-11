import type { Endpoint } from 'payload';

import { createLogger } from '@/lib/logger';

const log = createLogger('bulkSetTenantApiKeys');

type BulkSetApiKeyEntry = {
  tenantId: string;
  apiKey: string;
};

export const bulkSetTenantApiKeys: Endpoint = {
  path: '/tenants/bulk-set-api-keys',
  method: 'post',
  handler: async (req) => {
    const expectedKey = process.env.INTERNAL_API_KEY;
    const receivedKey = req.headers?.get('x-internal-api-key');

    if (!expectedKey) {
      log.error('INTERNAL_API_KEY is not configured; bulk update is disabled');
      return Response.json(
        { error: 'Internal API key not configured on server.' },
        { status: 500 },
      );
    }

    if (!receivedKey || receivedKey !== expectedKey) {
      log.warn('Unauthorized bulk-set-api-keys attempt');
      return Response.json(
        { error: 'Unauthorized. Provide a valid x-internal-api-key header.' },
        { status: 401 },
      );
    }

    let body: { apiKeys?: BulkSetApiKeyEntry[] };
    try {
      body = ((await req.json?.()) ?? {}) as { apiKeys?: BulkSetApiKeyEntry[] };
    } catch (error) {
      log.warn({ err: error }, 'Failed to parse bulk-set-api-keys JSON body');
      return Response.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const { apiKeys } = body;
    if (!Array.isArray(apiKeys)) {
      return Response.json(
        { error: 'Missing or invalid "apiKeys" array in request body.' },
        { status: 400 },
      );
    }

    const updated: string[] = [];
    const failed: { tenantId: string; error: string }[] = [];

    await Promise.all(
      apiKeys.map(async ({ tenantId, apiKey }) => {
        if (typeof tenantId !== 'string' || !tenantId.trim()) {
          failed.push({
            tenantId: String(tenantId ?? ''),
            error: 'Invalid tenantId',
          });
          return;
        }
        if (typeof apiKey !== 'string' || !apiKey.trim()) {
          failed.push({ tenantId, error: 'Invalid apiKey' });
          return;
        }

        try {
          await req.payload.update({
            collection: 'tenants',
            id: tenantId,
            data: { api: { apiKey } },
            overrideAccess: true,
          });
          updated.push(tenantId);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          log.error(
            { err: error, tenantId },
            'Failed to bulk-set tenant API key',
          );
          failed.push({ tenantId, error: message });
        }
      }),
    );

    log.info(
      { updatedCount: updated.length, failedCount: failed.length },
      'Bulk-set tenant API keys completed',
    );

    return Response.json(
      {
        status: failed.length === 0 ? 'ok' : 'partial',
        updated,
        failed,
      },
      { status: failed.length === 0 ? 200 : 207 },
    );
  },
};
