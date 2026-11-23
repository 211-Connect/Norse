'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useTransition,
  type ReactNode,
} from 'react';

import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { resultsUrlFor } from './landing';
import { v2ApiPath } from './v2-request';
import { seedMatches, v2CallString, type V2Seed } from './v2-seed';

import {
  answerChanges,
  activeFiltersOf,
  facetsToFilters,
  nextV2Params,
  withoutNX,
  type V2Changes,
  type V2Question,
  type V2Response,
} from './v2-contract';

export * from './v2-contract';

/**
 * Prototype (round 17). The page reads its questions, the emergency question and intent from one
 * `GET /v2/search` call (ADR 0039, OpenAPI draft). The URL is the only state: an answer writes
 * `needs`, `passed_needs`, or `urgency`, and the same call runs again.
 */

const list = (value: string | null) =>
  (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export function useV2Url() {
  const params = useSearchParams()!;
  const query = (params.get('query_label') ?? params.get('query') ?? '').trim();
  return {
    params,
    query,
    needs: list(withoutNX(params.get('needs'))),
    passedNeeds: list(params.get('passed_needs')),
    urgency: params.get('urgency') ?? undefined,
    refine: params.get('refine') === '1',
    asked: list(params.get('asked')),
  };
}

async function fetchV2(
  tenantId: string | undefined,
  callString: string,
  limit: number | undefined,
  locale: string | undefined,
  signal?: AbortSignal,
): Promise<V2Response> {
  const res = await fetch(v2ApiPath(tenantId, callString, limit, locale), {
    signal,
  });
  if (!res.ok) throw new Error(`v2 search ${res.status}`);
  return (await res.json()) as V2Response;
}

/**
 * The first answer, fetched by the server for the results URL and put in the HTML. The hook starts
 * from it, so the page does not call `/api/v2-search` again for the same URL.
 */
const V2SeedContext = createContext<V2Seed | null>(null);

export function V2SeedProvider({
  seed,
  children,
}: {
  seed: V2Seed;
  children: ReactNode;
}) {
  return createElement(V2SeedContext.Provider, { value: seed }, children);
}

/** The page's language, as it is: a Spanish page asks for Spanish results. Part of the cache key. */
function useV2Locale(): string | undefined {
  const { i18n } = useTranslation();
  return i18n.language || undefined;
}

export function useV2Search() {
  const { params, query: urlQuery } = useV2Url();
  const { tenantId, featureFlags, search } = useAppConfig();
  const locale = useV2Locale();
  const limit = search.resultsLimit;
  // The tenant's switch: with it off no v2 call runs, and `query` is empty, so every caller shows v1.
  const v2On = featureFlags.enableV2Api;
  const query = v2On ? urlQuery : '';
  const callString = useMemo(() => v2CallString(params), [params]);
  const seed = useContext(V2SeedContext);
  const seeded = v2On && seedMatches(seed, tenantId, callString) ? seed : null;

  const result = useQuery({
    initialData: seeded?.data,
    initialDataUpdatedAt: seeded?.fetchedAt,
    queryKey: ['v2-search', tenantId, locale, callString],
    enabled: Boolean(query && tenantId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: ({ signal }) =>
      fetchV2(tenantId, callString, limit, locale, signal),
  });
  // The query client outlives requests on the server, so a server render uses the seed, never an
  // older cache entry. On the client the two are the same until the first refetch.
  const data =
    typeof window === 'undefined' && seeded ? seeded.data : result.data;
  return { ...result, data, query };
}

/**
 * The facets of the v2 response, in the filter panel's shape; `undefined` until the response has a
 * facet list, so the panel can keep showing the v1 facets meanwhile.
 */
export function useV2Facets() {
  const { data } = useV2Search();
  const params = useSearchParams()!;
  return useMemo(
    () => facetsToFilters(data?.facets, activeFiltersOf(params)),
    [data, params],
  );
}

/**
 * Load the `/v2/search` answer for the URL that `changes` would make, into the same cache entry
 * the next page reads. The landing box waits on it, so the page moves only once the answer is
 * known (Lucas, 2026-11-16). A failed call resolves too: the next page shows its own error.
 */
export function useV2Prefetch() {
  const { params } = useV2Url();
  const { tenantId, search } = useAppConfig();
  const locale = useV2Locale();
  const limit = search.resultsLimit;
  const queryClient = useQueryClient();
  return useCallback(
    async (changes: V2Changes) => {
      const callString = v2CallString(nextV2Params(params, changes));
      await queryClient
        .fetchQuery({
          queryKey: ['v2-search', tenantId, locale, callString],
          staleTime: 60_000,
          queryFn: ({ signal }) =>
            fetchV2(tenantId, callString, limit, locale, signal),
        })
        .catch(() => undefined);
    },
    [params, queryClient, tenantId, limit, locale],
  );
}

/** URL writes. An answer is a new history entry, so the browser's Back button undoes one answer. */
export function useV2Navigate() {
  const { params, needs, passedNeeds, asked } = useV2Url();
  const appConfig = useAppConfig();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const write = useCallback(
    (changes: V2Changes, history: 'push' | 'replace' = 'push') => {
      // A new query text drops urgency, needs and passed_needs (Decision 51).
      const next = nextV2Params(params, changes);
      startTransition(() => {
        router[history](`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  /**
   * One answer. Each picked option writes its own `parameter` (Decision 55); unpicked need
   * options join `passed_needs`, so the rules engine never offers them again.
   */
  const answer = useCallback(
    (question: V2Question, picked: string[], extra: V2Changes = {}) => {
      write({
        asked: [...new Set([...asked, question.id])],
        ...answerChanges(question, picked, { needs, passedNeeds }),
        ...extra,
      });
    },
    [asked, needs, passedNeeds, write],
  );

  /**
   * Leave the landing page for the results page, carrying the answers in the URL. `changes` are
   * applied first (the last pick on this step). Replace drops the landing step from history, so
   * Back from the results goes to where the person came from, not into the questions again.
   */
  const toResults = useCallback(
    (changes: V2Changes = {}, history: 'push' | 'replace' = 'push') => {
      const next = nextV2Params(params, changes);
      startTransition(() => {
        router[history](
          resultsUrlFor(next.toString(), appConfig.search.searchEngine),
          { scroll: true },
        );
      });
    },
    [appConfig.search.searchEngine, params, router],
  );

  /** The last pick on a landing step, then the results page. */
  const answerToResults = useCallback(
    (question: V2Question, picked: string[]) =>
      toResults({
        asked: [...new Set([...asked, question.id])],
        ...answerChanges(question, picked, { needs, passedNeeds }),
      }),
    [asked, needs, passedNeeds, toResults],
  );

  return { write, answer, toResults, answerToResults, isPending };
}
