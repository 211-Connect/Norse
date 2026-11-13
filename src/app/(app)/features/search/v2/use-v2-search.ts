'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

import {
  answerChanges,
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
 * `needs`, `passed_needs`, `urgency` or `other`, and the same call runs again.
 */

/** The draft v2 parameters, in the order the call sends them. */
const CALL_KEYS = [
  'query',
  'other',
  'needs',
  'passed_needs',
  'urgency',
  'taxonomy',
  'location',
  'coords',
  'distance',
  'page',
] as const;

/** At most this many guided questions before the results (Lucas, round 10). */
export const MAX_GUIDED = 3;

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

export function useV2Search() {
  const { params, query } = useV2Url();
  const { tenantId } = useAppConfig();
  const callString = useMemo(() => {
    const call = new URLSearchParams();
    for (const key of CALL_KEYS) {
      const raw = params.get(key);
      const value = key === 'needs' ? withoutNX(raw) : raw;
      if (value) call.set(key, value);
    }
    return call.toString();
  }, [params]);

  const result = useQuery({
    queryKey: ['v2-search', tenantId, callString],
    enabled: Boolean(query && tenantId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/v2-search?tenant_id=${encodeURIComponent(tenantId ?? '')}&${callString}`,
        { signal },
      );
      if (!res.ok) throw new Error(`v2 search ${res.status}`);
      return (await res.json()) as V2Response;
    },
  });
  return { ...result, query };
}

/** URL writes. An answer is a new history entry, so the browser's Back button undoes one answer. */
export function useV2Navigate() {
  const { params, needs, passedNeeds, asked } = useV2Url();
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

  return { write, answer, isPending };
}
