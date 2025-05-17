import { API_URL, COOKIE_TENANT_ID } from '@/lib/constants';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cookieStore = await cookies();

  const query = searchParams.get('query');
  const locale = searchParams.get('locale');
  const tenantId = cookieStore.get(COOKIE_TENANT_ID)?.value;

  if (!tenantId) {
    throw new Error('No tenant id');
  }

  const response = await fetch(
    `${API_URL}/taxonomy?query=${query}&locale=${locale}&tenant_id=${tenantId}`,
    {
      method: 'GET',
      headers: {
        'accept-language': locale || 'en',
        'x-api-version': '1',
        'x-tenant-id': tenantId || '',
      },
    },
  );

  if (!response.ok) {
    return Response.json({ data: null, error: 'Unable to fetch taxonomies' });
  }

  const json = await response.json();

  return Response.json({
    data:
      json?.hits?.hits?.map((hit) => ({
        id: hit?._id,
        code: hit?._source?.code,
        name: hit?._source?.name,
      })) ?? [],
    error: null,
  });
}
