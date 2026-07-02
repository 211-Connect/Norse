import {
  EnableTaxonomyScorecardRequest,
  EnableTaxonomyScorecardResponse,
  GetTaxonomyScorecardResponse,
  SearchTaxonomiesResponse,
  UpdateTaxonomyScorecardRequest,
  UpdateTaxonomyScorecardResponse,
} from '@/types/taxonomyScorecard';
import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import { API_URL, INTERNAL_API_KEY } from '@/app/(app)/shared/lib/constants';

function toRequestHeaders(headers?: HeadersInit): Headers {
  const output = new Headers(headers);

  if (!output.has('Content-Type')) {
    output.set('Content-Type', 'application/json');
  }

  if (!INTERNAL_API_KEY) {
    throw new Error('INTERNAL_API_KEY is not set in environment variables.');
  }

  output.set('x-api-version', '1');
  output.set('x-internal-api-key', INTERNAL_API_KEY);

  return output;
}

export async function searchTaxonomies(params: {
  tenantId: string;
  query: string;
  page?: number;
  limit?: number;
}): Promise<SearchTaxonomiesResponse> {
  const searchParams = new URLSearchParams({
    tenant_id: params.tenantId,
    query: params.query,
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });

  const result = await fetchWrapper<SearchTaxonomiesResponse>(
    `${API_URL}/taxonomy-scorecard/taxonomies?${searchParams.toString()}`,
    {
      method: 'GET',
      headers: toRequestHeaders(),
      cache: 'no-store',
    },
  );

  if (result === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return result;
}

export async function getScorecard(params: {
  tenantId: string;
  hsisCode: string;
}): Promise<GetTaxonomyScorecardResponse> {
  const tenantId = encodeURIComponent(params.tenantId);
  const hsisCode = encodeURIComponent(params.hsisCode);

  const result = await fetchWrapper<GetTaxonomyScorecardResponse>(
    `${API_URL}/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}`,
    {
      method: 'GET',
      headers: toRequestHeaders(),
      cache: 'no-store',
    },
  );

  if (result === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return result;
}

export async function updateScorecard(params: {
  tenantId: string;
  hsisCode: string;
  body: UpdateTaxonomyScorecardRequest;
}): Promise<UpdateTaxonomyScorecardResponse> {
  const tenantId = encodeURIComponent(params.tenantId);
  const hsisCode = encodeURIComponent(params.hsisCode);
  const searchParams = new URLSearchParams({
    draft: params.body.draft ? 'true' : 'false',
  });

  const result = await fetchWrapper<UpdateTaxonomyScorecardResponse>(
    `${API_URL}/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}?${searchParams.toString()}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        weights: params.body.weights,
        include_children: params.body.include_children,
        include_siblings: params.body.include_siblings,
      }),
      headers: toRequestHeaders(),
      cache: 'no-store',
    },
  );

  if (result === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return result;
}

export async function enableScorecard(params: {
  tenantId: string;
  hsisCode: string;
  body: EnableTaxonomyScorecardRequest;
}): Promise<EnableTaxonomyScorecardResponse> {
  const tenantId = encodeURIComponent(params.tenantId);
  const hsisCode = encodeURIComponent(params.hsisCode);

  const result = await fetchWrapper<EnableTaxonomyScorecardResponse>(
    `${API_URL}/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}/enable`,
    {
      method: 'POST',
      body: JSON.stringify(params.body),
      headers: toRequestHeaders(),
      cache: 'no-store',
    },
  );

  if (result === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return result;
}
