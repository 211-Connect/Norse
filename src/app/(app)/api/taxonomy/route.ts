import { apiFetch } from '@/lib/server/api-fetch';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  const response = await apiFetch(`/taxonomy?query=${query}`, {
    method: 'GET',
    headers: {
      'x-api-version': '1',
    },
  });

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
