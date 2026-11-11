'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';

import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';

/**
 * Prototype (round 17). The page reads its questions, emergency band and intent from one
 * `GET /v2/search` call (draft contract, v2-search--api-contract). The URL is the only state:
 * an answer writes `needs`, `passed_needs`, `urgency` or `other`, and the same call runs again.
 */

export type V2Option = { value: string; label: string; resultsCount?: number };
export type V2Question = {
  id: string;
  type: 'emergency' | 'confirm_urgency' | 'find_need' | 'narrow';
  level: 'red' | 'orange' | 'low';
  importance: 'critical' | 'high' | 'medium' | 'low';
  parameter: 'urgency' | 'needs';
  reason: string;
  stem: string;
  options: V2Option[];
  multiSelect: boolean;
  allowOther: boolean;
  noneOfThese: boolean;
  hotlines?: { label: string; number: string }[];
};
export type V2Response = {
  intent: {
    query?: string;
    needs: { value: string; state: 'use' | 'ask'; source: string; confidence?: number }[];
    passed_needs: string[];
    boost_needs: string[];
    urgency: { value: string; source: string; state: string };
  };
  emergency: {
    band: 'popup' | 'soft' | 'none' | 'unknown';
    show_hotline: boolean;
    hotlines: { label: string; number: string }[];
  };
  clarification: { rulesVersion: string; questions: V2Question[] };
  total: number;
  versions: { model: string | null; rules: string; scorecard: string | null };
  timing_ms: { classify: number; total: number };
  prototype?: { services: string; classifier: string };
};

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
    needs: list(params.get('needs')),
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
      const value = params.get(key);
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

type Changes = Record<string, string | string[] | null>;

/** URL writes. An answer is a new history entry, so the browser's Back button undoes one answer. */
export function useV2Navigate() {
  const { params, needs, passedNeeds, asked } = useV2Url();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const write = useCallback(
    (changes: Changes, history: 'push' | 'replace' = 'push') => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        const text = Array.isArray(value) ? value.join(',') : value;
        if (text === null || text === '') next.delete(key);
        else next.set(key, text);
      }
      next.delete('page');
      startTransition(() => {
        router[history](`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  /**
   * One answer. Picked needs join `needs`; the options left unpicked join `passed_needs`, so the
   * rules engine never offers them again. "None of these" and Skip pass every option.
   * U-0 never reaches the URL: the caller keeps the emergency in memory.
   */
  const answer = useCallback(
    (question: V2Question, picked: string[], extra: Changes = {}) => {
      const changes: Changes = {
        asked: [...new Set([...asked, question.id])],
        ...extra,
      };
      if (question.parameter === 'needs') {
        const offered = question.options.map((o) => o.value);
        changes.needs = [...new Set([...needs, ...picked])];
        changes.passed_needs = [
          ...new Set([
            ...passedNeeds,
            ...offered.filter((v) => !picked.includes(v)),
          ]),
        ];
      } else {
        // Skip on an urgency question writes U-X ("not known"), so the question is not asked again.
        const level = picked.find((v) => v !== 'U-0');
        changes.urgency = level ?? 'U-X';
      }
      write(changes);
    },
    [asked, needs, passedNeeds, write],
  );

  return { write, answer, isPending };
}

/** The colour style of a question card: red for danger, orange when it changes results a lot. */
export const styleOf = (q: V2Question) =>
  q.level === 'red'
    ? 'emergency'
    : q.level === 'orange'
      ? q.type === 'confirm_urgency'
        ? 'confirm_urgency'
        : 'find_need'
      : 'narrow';
