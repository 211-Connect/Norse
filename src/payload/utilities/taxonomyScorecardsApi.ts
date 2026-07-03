import { taxonomyScorecardApiClient } from '@/lib/api/clients';
import {
  EnableTaxonomyScorecardDto,
  TaxonomyScorecardControllerEnableTaxonomyScorecardVersionData,
  TaxonomyScorecardControllerGetTaxonomyConfigurationData,
  TaxonomyScorecardControllerSearchTaxonomiesData,
  TaxonomyScorecardControllerUpdateTaxonomyConfigurationData,
  UpdateTaxonomyScorecardDto,
} from '@/lib/api/generated/data-contracts';

type UpdateTaxonomyScorecardRequest = UpdateTaxonomyScorecardDto & {
  draft?: boolean;
};

export async function searchTaxonomies(params: {
  tenantId: string;
  query: string;
  page?: number;
  limit?: number;
}): Promise<TaxonomyScorecardControllerSearchTaxonomiesData> {
  const response =
    await taxonomyScorecardApiClient.taxonomyScorecardControllerSearchTaxonomies(
      {
        tenant_id: params.tenantId,
        query: params.query,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
    );

  if (response.data === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return response.data;
}

export async function getScorecard(params: {
  tenantId: string;
  hsisCode: string;
}): Promise<TaxonomyScorecardControllerGetTaxonomyConfigurationData> {
  const response =
    await taxonomyScorecardApiClient.taxonomyScorecardControllerGetTaxonomyConfiguration(
      {
        tenantId: params.tenantId,
        hsisCode: params.hsisCode,
      },
    );

  if (response.data === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return response.data;
}

export async function updateScorecard(params: {
  tenantId: string;
  hsisCode: string;
  body: UpdateTaxonomyScorecardRequest;
}): Promise<TaxonomyScorecardControllerUpdateTaxonomyConfigurationData> {
  const query = {
    tenantId: params.tenantId,
    hsisCode: params.hsisCode,
    draft: params.body.draft ?? false,
  };

  const body: UpdateTaxonomyScorecardDto = {
    weights: params.body.weights,
    include_children: params.body.include_children,
    include_siblings: params.body.include_siblings,
  };

  const response =
    await taxonomyScorecardApiClient.taxonomyScorecardControllerUpdateTaxonomyConfiguration(
      query,
      body,
    );

  if (response.data === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return response.data;
}

export async function enableScorecard(params: {
  tenantId: string;
  hsisCode: string;
  body: EnableTaxonomyScorecardDto;
}): Promise<TaxonomyScorecardControllerEnableTaxonomyScorecardVersionData> {
  const body: EnableTaxonomyScorecardDto = {
    version_id: params.body.version_id,
  };

  const response =
    await taxonomyScorecardApiClient.taxonomyScorecardControllerEnableTaxonomyScorecardVersion(
      {
        tenantId: params.tenantId,
        hsisCode: params.hsisCode,
      },
      body,
    );

  if (response.data === null) {
    throw new Error('Failed to connect to Norse API.');
  }

  return response.data;
}
