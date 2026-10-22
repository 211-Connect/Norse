'use server';

import { initialTransition, transition } from 'xstate';

import type { SearchIntent } from '@/app/(app)/features/search/intent';
import {
  pageActionOf,
  searchPolicy,
  searchResolverMachine,
} from '@/app/(app)/features/search/resolver';
import type { LegacyAiClarifyState } from '@/app/(app)/features/search/intent';
import { predictSearchNeeds } from '@/app/(app)/shared/services/ai-classification-search-service';
import { createLogger } from '@/lib/logger';
import { PrintableDirectoryContextParams } from '@/app/(app)/shared/utils/printableDirectorySearchContext';
import { AppConfig } from '@/types/appConfig';
import { redirect } from 'next/navigation';

const log = createLogger('handle-legacy-deep-links');

type Args = {
  appConfig: AppConfig;
  intent: SearchIntent;
  locale: string;
  skipLegacyLinkCheck: boolean;
  /**
   * Kept on the redirect, so a directory source opened from its "Go to
   * search results" link stays editable.
   */
  printableDirectoryContext?: PrintableDirectoryContextParams;
};

/**
 * The server half of the search resolver: resolves the intent before the search runs, predicts when the
 * resolver asks for it, and redirects when the resolved state says so. Returns the clarify state the page
 * renders beside the results, or null.
 */
export async function handleLegacyDeepLinks({
  appConfig,
  intent,
  locale,
  skipLegacyLinkCheck,
}: Args): Promise<LegacyAiClarifyState | null> {
  let [snapshot] = initialTransition(searchResolverMachine, {
    intent,
    loopGuard: skipLegacyLinkCheck,
    policy: searchPolicy({
      searchEngine: appConfig.search.searchEngine,
      requireUserLocation: appConfig.featureFlags.requireUserLocation,
    }),
    searchEngine: appConfig.search.searchEngine,
  });

  if (snapshot.value === 'needs_prediction') {
    // The resolver only asks for a prediction when there is a query to classify.
    const { query } = snapshot.context.searchQuery;
    if (!query) throw new Error('search resolver asked to predict no query');
    log.debug('Handling legacy deep link for AI classification search engine');
    const prediction = await predictSearchNeeds(
      { query },
      locale,
      appConfig.tenantId,
    );
    if (!prediction) {
      log.warn(
        'Skipping legacy deep link handling because predictResponse is null',
      );
    }
    [snapshot] = transition(searchResolverMachine, snapshot, {
      type: 'PREDICTION_RESOLVED',
      prediction,
    });
  }

  log.debug({ state: snapshot.value }, 'Search resolved');
  if (pageActionOf(snapshot) === 'page:redirect') {
    const { redirectTo } = snapshot.context;
    if (!redirectTo)
      throw new Error(`search state ${snapshot.value} has no redirect`);
    return redirect(redirectTo);
  }
  return snapshot.context.clarify;
}
