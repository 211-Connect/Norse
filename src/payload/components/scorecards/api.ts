import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import {
  GetTaxonomyScorecardResponse,
  TaxonomySearchItem,
  UpdateTaxonomyScorecardRequest,
  UpdateTaxonomyScorecardResponse,
} from '@/types/taxonomyScorecard';

import { ScorecardsSearchResult, ScorecardsStatusResponse } from './types';

function buildStatusPath(tenantId: string): string {
  return `/api/taxonomy-scorecards/status?tenantId=${encodeURIComponent(tenantId)}`;
}

function buildTaxonomySearchPath(tenantId: string, query: string): string {
  return `/api/taxonomy-scorecards/taxonomies?tenantId=${encodeURIComponent(tenantId)}&query=${encodeURIComponent(query)}&page=1&limit=100`;
}

function buildTaxonomyScorecardPath(
  tenantId: string,
  hsisCode: string,
): string {
  return `/api/taxonomy-scorecards/tenants/${encodeURIComponent(tenantId)}/taxonomies/${encodeURIComponent(hsisCode)}`;
}

function buildTaxonomyScorecardEnablePath(
  tenantId: string,
  hsisCode: string,
): string {
  return `/api/taxonomy-scorecards/tenants/${encodeURIComponent(tenantId)}/taxonomies/${encodeURIComponent(hsisCode)}/enable`;
}

export async function fetchStatus(
  tenantId: string,
): Promise<ScorecardsStatusResponse> {
  const result = await fetchWrapper<ScorecardsStatusResponse>(
    buildStatusPath(tenantId),
  );

  if (!result) {
    throw new Error('Failed to load scorecards status.');
  }

  return result;
}

export async function searchTaxonomyItems(
  tenantId: string,
  query: string,
  options?: RequestInit,
): Promise<TaxonomySearchItem[]> {
  const result = await fetchWrapper<ScorecardsSearchResult>(
    buildTaxonomySearchPath(tenantId, query),
    options,
  );

  if (!result) {
    throw new Error('Failed to search taxonomies.');
  }

  return result.items;
}

export async function fetchScorecard(
  tenantId: string,
  hsisCode: string,
): Promise<GetTaxonomyScorecardResponse> {
  const result = await fetchWrapper<GetTaxonomyScorecardResponse>(
    buildTaxonomyScorecardPath(tenantId, hsisCode),
  );

  if (!result) {
    throw new Error('Failed to load scorecard.');
  }

  return result;
}

export async function saveScorecard(
  tenantId: string,
  hsisCode: string,
  body: UpdateTaxonomyScorecardRequest,
): Promise<UpdateTaxonomyScorecardResponse> {
  const queryParams = new URLSearchParams({
    draft: body.draft ? 'true' : 'false',
  });

  const result = await fetchWrapper<UpdateTaxonomyScorecardResponse>(
    `${buildTaxonomyScorecardPath(tenantId, hsisCode)}?${queryParams.toString()}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        weights: body.weights,
        include_children: body.include_children,
        include_siblings: body.include_siblings,
      },
    },
  );

  if (!result) {
    throw new Error('Failed to save scorecard.');
  }

  return result;
}

export async function enableScorecardVersion(
  tenantId: string,
  hsisCode: string,
  versionId: number,
): Promise<void> {
  await fetchWrapper(buildTaxonomyScorecardEnablePath(tenantId, hsisCode), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      version_id: versionId,
    },
  });
}
