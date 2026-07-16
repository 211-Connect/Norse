'use server';

import { predictSearchNeeds } from '@/app/(app)/shared/services/ai-classification-search-service';
import { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import { createLogger } from '@/lib/logger';
import { AppConfig } from '@/types/appConfig';
import { redirect } from 'next/navigation';
import { buildSearchUrl, BuildSearchUrlArgs } from './buildSearchUrl';

const log = createLogger('handle-legacy-deep-links');

type Args = {
  appConfig: AppConfig;
  searchQuery: FindResourcesQuery;
  locale: string;
  skipLegacyLinkCheck: boolean;
};

export async function handleLegacyDeepLinks({
  appConfig,
  searchQuery,
  locale,
  skipLegacyLinkCheck,
}: Args): Promise<unknown> {
  if (appConfig.search.searchEngine !== 'ai_classification') {
    log.debug(
      "Skipping legacy deep link handling because search engine is not 'ai_classification'",
    );
    return;
  }

  if (skipLegacyLinkCheck) {
    log.debug(
      'Skipping legacy deep link handling because skipLegacyLinkCheck is true',
    );
    return;
  }

  if (searchQuery.queryType === 'hybrid' && searchQuery.taxonomy?.length) {
    log.debug(
      "Skipping legacy deep link handling because queryType is 'hybrid' and taxonomy is present",
    );
    return;
  }

  if (searchQuery.queryType === 'taxonomy') {
    log.debug(
      "Skipping legacy deep link handling because queryType is 'taxonomy'",
    );
    return;
  }

  if (!searchQuery.query) {
    log.debug(
      'Skipping legacy deep link handling because query is not present',
    );
    return;
  }

  log.debug('Handling legacy deep link for AI classification search engine');
  const predictResponse = await predictSearchNeeds(
    {
      query: searchQuery.query,
    },
    locale,
    appConfig.tenantId,
  );

  if (!predictResponse) {
    log.warn(
      'Skipping legacy deep link handling because predictResponse is null',
    );
    return;
  }
  const scenario = predictResponse.scenario;

  if (
    [
      'search',
      'search_and_notify_low_confidence',
      'search_and_notify_low_info',
    ].includes(scenario)
  ) {
    log.debug(
      `Handling legacy deep link for scenario: ${scenario}, taxonomies: ${predictResponse.hsis_taxonomies}`,
    );

    const searchUrlArgs: BuildSearchUrlArgs = {
      ...searchQuery,
      aiScenario: scenario,
      taxonomies: predictResponse.hsis_taxonomies,
      searchEngine: appConfig.search.searchEngine,
      skipLegacyLinkCheck: true,
    };

    const url = buildSearchUrl(searchUrlArgs);

    return redirect(url);
  }

  const options = Array.isArray(predictResponse.options)
    ? predictResponse.options
    : [];

  log.debug(
    `Handling legacy deep link for scenario: ${scenario}, taxonomies: ${predictResponse.hsis_taxonomies}, options: ${options}`,
  );

  const searchUrlArgs: BuildSearchUrlArgs = {
    ...searchQuery,
    clarifyOptions: options,
    clarifyScenario: scenario,
    searchEngine: appConfig.search.searchEngine,
    skipLegacyLinkCheck: true,
  };

  const url = buildSearchUrl(searchUrlArgs);

  return redirect(url);
}
