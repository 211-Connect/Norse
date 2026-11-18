'use client';

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import { resultsUrlFor } from './landing';

import {
  answerChanges,
  nextV2Params,
  withoutNX,
  type V2Changes,
  type V2Question,
  type V2Response,
  MAX_GUIDED,
} from './v2-contract';

export * from './v2-contract';

/**
 * Prototype (round 17). The page reads its questions, the emergency question and intent from one
 * `GET /v2/search` call (ADR 0039, OpenAPI draft). The URL is the only state: an answer writes
 * `needs`, `passed_needs`, or `urgency`, and the same call runs again.
 */

/** The draft v2 parameters, in the order the call sends them. */
const CALL_KEYS = [
  'query',
  'needs',
  'passed_needs',
  'urgency',
  'taxonomy',
  'location',
  'coords',
  'distance',
  'page',
] as const;

export { MAX_GUIDED };

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

/** The `/v2/search` parameters of a page URL, in one stable string (the query cache key). */
function v2CallString(params: URLSearchParams): string {
  const call = new URLSearchParams();
  for (const key of CALL_KEYS) {
    const raw = params.get(key);
    const value = key === 'needs' ? withoutNX(raw) : raw;
    if (value) call.set(key, value);
  }
  return call.toString();
}

async function fetchV2(
  tenantId: string | undefined,
  callString: string,
  signal?: AbortSignal,
): Promise<V2Response> {
  const res = await fetch(
    `/api/v2-search?tenant_id=${encodeURIComponent(tenantId ?? '')}&${callString}`,
    { signal },
  );
  if (!res.ok) throw new Error(`v2 search ${res.status}`);
  return (await res.json()) as V2Response;
}

export function useV2Search() {
  const { params, query } = useV2Url();
  const { tenantId } = useAppConfig();
  const callString = useMemo(() => v2CallString(params), [params]);

  const result = useQuery({
    queryKey: ['v2-search', tenantId, callString],
    enabled: Boolean(query && tenantId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: ({ signal }) => fetchV2(tenantId, callString, signal),
  });
  return { ...result, query };
}

/**
 * Load the `/v2/search` answer for the URL that `changes` would make, into the same cache entry
 * the next page reads. The landing box waits on it, so the page moves only once the answer is
 * known (Lucas, 2026-11-16). A failed call resolves too: the next page shows its own error.
 */
export function useV2Prefetch() {
  const { params } = useV2Url();
  const { tenantId } = useAppConfig();
  const queryClient = useQueryClient();
  return useCallback(
    async (changes: V2Changes) => {
      const callString = v2CallString(nextV2Params(params, changes));
      await queryClient
        .fetchQuery({
          queryKey: ['v2-search', tenantId, callString],
          staleTime: 60_000,
          queryFn: ({ signal }) => fetchV2(tenantId, callString, signal),
        })
        .catch(() => undefined);
    },
    [params, queryClient, tenantId],
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
