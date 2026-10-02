import { getAuthHeaders } from '@/app/(app)/shared/lib/authHeaders';
import { getTenantApiKey } from './getTenantApiKey';

function headersInitToRecord(
  headers: HeadersInit | null,
): Record<string, string> {
  if (!headers) {
    return {};
  }

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
  locale?: string,
  withAuth = false,
): Promise<Record<string, string>> => {
  const [authHeaders, tenantApiKey] = await Promise.all([
    withAuth ? getAuthHeaders(tenantId) : null,
    getTenantApiKey(tenantId),
  ]);

  return {
    'x-api-version': '1',
    'x-tenant-id': tenantId,
    ...headersInitToRecord(authHeaders),
    ...(tenantApiKey ? { 'x-api-key': tenantApiKey } : {}),
    ...(locale ? { 'accept-language': locale } : {}),
  };
};
