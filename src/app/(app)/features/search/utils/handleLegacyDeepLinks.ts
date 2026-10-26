import { predictSearchNeeds } from '@/app/(app)/shared/services/ai-classification-search-service';
import { FindResourcesQuery } from '@/app/(app)/shared/services/search-service';
import { createLogger } from '@/lib/logger';
import {
  PrintableDirectoryContextParams,
  withPrintableDirectoryContext,
} from '@/app/(app)/shared/utils/printableDirectorySearchContext';
import { AppConfig } from '@/types/appConfig';
import { redirect } from 'next/navigation';
import { buildSearchUrl, BuildSearchUrlArgs } from './buildSearchUrl';

const log = createLogger('handle-legacy-deep-links');

type Args = {
  appConfig: AppConfig;
  searchQuery: FindResourcesQuery;
  locale: string;
  skipLegacyLinkCheck: boolean;
  /**
   * Kept on the redirect, so a directory source opened from its "Go to
   * search results" link stays editable.
   */
  printableDirectoryContext?: PrintableDirectoryContextParams;
};

/**
 * Server-only: called by the search page before it searches. Deliberately
 * not a `'use server'` module, which would make it a publicly callable
 * action taking a client-supplied app config.
 */
export async function handleLegacyDeepLinks({
  appConfig,
  searchQuery,
  locale,
  skipLegacyLinkCheck,
  printableDirectoryContext,
}: Args): Promise<unknown> {
  const contextParams = new URLSearchParams(printableDirectoryContext);

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

  if (searchQuery.organizationId) {
    log.debug(
      'Skipping legacy deep link handling because the search is scoped to an organization',
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

    return redirect(withPrintableDirectoryContext(url, contextParams));
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

  return redirect(withPrintableDirectoryContext(url, contextParams));
}
