import { getTenantApiKey } from '@/lib/api/getTenantApiKey';

import { getAuthHeaders } from './authHeaders';

function headersInitToRecord(headers: HeadersInit): Record<string, string> {
  if (headers instanceof Headers) {
    const record: Record<string, string> = {};
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers as Record<string, string>;
}

export const getApiHeaders = async (
  tenantId: string,
): Promise<Record<string, string>> => {
  const [authHeaders, tenantApiKey] = await Promise.all([
    getAuthHeaders(tenantId),
    getTenantApiKey(tenantId),
  ]);

  return {
    ...headersInitToRecord(authHeaders),
    'x-api-key': tenantApiKey,
    'x-api-version': '1',
  };
};
