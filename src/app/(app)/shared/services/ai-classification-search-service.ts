'use server';

import { createLogger } from '@/lib/logger';

import { API_URL, INTERNAL_API_KEY } from '../lib/constants';
import { fetchWrapper } from '../lib/fetchWrapper';

const log = createLogger('ai-classification-search-service');

export type AiClassificationScenario =
  | 'search'
  | 'clarify_low_info'
  | 'clarify_multiple_labels'
  | 'search_and_notify_low_info'
  | 'search_and_notify_low_confidence';

export type AiPredictOption = {
  code: string;
  score: number | null;
  pre_selected: boolean;
  results_count?: number | null;
};

export type AiPredictResponse = {
  scenario: AiClassificationScenario;
  options?: AiPredictOption[] | null;
  hsis_taxonomies?: string[] | null;
};

export type NeedWeights = Record<string, number>;

export type AiReRankResponse = {
  hsis_taxonomies?: string[] | null;
};

type PredictRequestBody = {
  query: string;
};

type ReRankRequestBody = {
  need_weights: NeedWeights;
};

function createAiHeaders(
  locale: string,
  tenantId?: string,
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'accept-language': locale,
    'x-api-version': '1',
    'x-api-key': INTERNAL_API_KEY || '',
    ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
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

  try {
    const response = await fetchWrapper<AiPredictResponse>(
      `${API_URL}/search/predict`,
      {
        method: 'POST',
        headers: createAiHeaders(locale, tenantId),
        body: { query },
        cache: 'no-store',
      },
    );

    if (!response) {
      return null;
    }

    return response;
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
  try {
    const response = await fetchWrapper<AiReRankResponse>(
      `${API_URL}/search/re-rank`,
      {
        method: 'POST',
        headers: createAiHeaders(locale, tenantId),
        body,
        cache: 'no-store',
      },
    );

    if (!response) {
      return null;
    }

    return {
      hsis_taxonomies: response.hsis_taxonomies,
    };
  } catch (error) {
    log.error(
      { err: error, tenantId, locale },
      'Re-rank classification request failed',
    );
    return null;
  }
}
