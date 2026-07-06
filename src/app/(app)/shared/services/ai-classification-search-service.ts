'use server';

import { createLogger } from '@/lib/logger';
import { searchApiClient } from '@/lib/api/clients';
import {
  AiSearchOptionDto,
  AiSearchPredictResponseDto,
  AiSearchReRankResponseDto,
  SearchControllerPredictNeedsClassificationParams,
} from '@/lib/api/generated/data-contracts';
import { RequestParams } from '@/lib/api/generated/http-client';

import { INTERNAL_API_KEY } from '../lib/constants';

const log = createLogger('ai-classification-search-service');

export type AiClassificationScenario = AiSearchPredictResponseDto['scenario'];
export type AiPredictOption = AiSearchOptionDto;
export type AiPredictResponse = AiSearchPredictResponseDto;

export type NeedWeights = Record<string, number>;

export type AiReRankResponse = AiSearchReRankResponseDto;

type PredictRequestBody = Pick<
  SearchControllerPredictNeedsClassificationParams,
  'query'
>;

type ReRankRequestBody = {
  need_weights: NeedWeights;
};

const DEFAULT_TOP_K = 150;

function createAiRequestParams(
  locale: string,
  tenantId: string,
): RequestParams {
  return {
    headers: {
      'accept-language': locale,
      'x-api-version': '1',
      'x-api-key': INTERNAL_API_KEY || '',
      'x-tenant-id': tenantId,
    },
  };
}

export async function predictSearchNeeds(
  body: PredictRequestBody,
  locale: string,
  tenantId?: string,
): Promise<AiPredictResponse | null> {
  const query = body.query?.trim();

  if (!query) {
    return null;
  }

  if (!tenantId) {
    log.error({ locale }, 'Predict classification request missing tenant ID');
    return null;
  }

  try {
    const response =
      await searchApiClient.searchControllerPredictNeedsClassification(
        {
          query,
          top_k: DEFAULT_TOP_K,
        },
        createAiRequestParams(locale, tenantId),
      );

    if (!response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    log.error(
      { err: error, tenantId, locale },
      'Predict classification request failed',
    );
    return null;
  }
}

export async function reRankSearchNeeds(
  body: ReRankRequestBody,
  locale: string,
  tenantId?: string,
): Promise<AiReRankResponse | null> {
  if (!tenantId) {
    log.error({ locale }, 'Re-rank classification request missing tenant ID');
    return null;
  }

  try {
    const response =
      await searchApiClient.searchControllerReRankNeedsClassification(
        {
          need_weights: JSON.stringify(body.need_weights),
          top_k: DEFAULT_TOP_K,
        },
        createAiRequestParams(locale, tenantId),
      );

    if (!response.data) {
      return null;
    }

    return response.data;
  } catch (error) {
    log.error(
      { err: error, tenantId, locale },
      'Re-rank classification request failed',
    );
    return null;
  }
}
