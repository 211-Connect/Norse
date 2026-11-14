/**
 * Prototype: the `GET /v2/search` response shape and the pure rules the page applies to it.
 * Source of truth: ArchitectureDocs `proposed-changes/v2-search/openapi-v2-search.draft.yaml` and
 * ADR 0039 (Decisions 25 to 28, 49 to 56). No React here, so the unit tests can import it.
 */

/** The URL parameter that a pick of an option adds (Decision 55). */
export type V2Parameter = 'needs' | 'passed_needs' | 'urgency';

export type V2Option = {
  label: string;
  parameter: V2Parameter;
  value: string;
  /** Services that carry this need; null or absent when not counted (Decision 46). */
  results_count?: number | null;
};

export type V2Hotline = { label: string; number: string };

export type V2Question = {
  id: string;
  type: 'emergency' | 'confirm_urgency' | 'find_need' | 'narrow';
  importance: 'critical' | 'high' | 'medium' | 'low';
  value?: number;
  priority?: number;
  uncertainty?: number;
  reason: string;
  step?: number;
  stem: string;
  /** The emergency question can have none: a caller `urgency=U-0` (Decision 50). */
  options: V2Option[];
  multi_select: boolean;
  allow_other: boolean;
  none_of_these: boolean;
  /** Emergency question only. */
  hotlines?: V2Hotline[];
};

/** A v1 search hit plus the one field v2 adds (Decision 56). */
export type V2Hit = {
  _id: string;
  _source?: Record<string, unknown>;
  /** Sent `needs=` codes this service matches. [] for none; absent when no needs were sent. */
  matched_needs?: string[];
};

export type V2Response = {
  search: {
    hits: { total?: { value: number } | number; hits: V2Hit[] };
  };
  intent: {
    query: string | null;
    needs: {
      value: string;
      state: 'use' | 'ask';
      source: 'caller' | 'inferred';
      confidence?: number;
    }[];
    urgency: { value: string; source: string; state: string };
  };
  clarification: { rules_version: string; questions: V2Question[] };
  model_version: string | null;
  rules_version: string;
  /** Prototype only: what the local stand-in used. Not part of the contract. */
  prototype?: {
    services: string;
    classifier: string;
    timing_ms: { classify: number; total: number };
  };
};

export const totalOf = (response: V2Response) => {
  const total = response.search.hits.total;
  return typeof total === 'number' ? total : (total?.value ?? 0);
};

/** The emergency lives only in this question; there is no top-level `emergency` (Decision 54). */
/** The look of a question card. The page chooses it from `type` and `importance`; the API sends no `level`. */
export type QuestionStyle =
  'emergency' | 'confirm_urgency' | 'find_need' | 'narrow';

/**
 * Red for the emergency question; orange for a question that changes the results a lot
 * (`importance` critical or high); quiet for the rest.
 */
export const styleOf = (
  q: Pick<V2Question, 'type' | 'importance'>,
): QuestionStyle =>
  q.type === 'emergency'
    ? 'emergency'
    : q.importance === 'critical' || q.importance === 'high'
      ? q.type === 'confirm_urgency'
        ? 'confirm_urgency'
        : 'find_need'
      : 'narrow';

/** A critical emergency question is the full red card; a lower importance is the calmer orange card. */
export const isSoftEmergency = (q?: Pick<V2Question, 'importance'>) =>
  Boolean(q) && q!.importance !== 'critical';

export const emergencyQuestionOf = (response?: V2Response) =>
  response?.clarification.questions.find((q) => q.type === 'emergency');

/** How a result relates to the needs the person picked. */
export type NeedsGroup = 'all' | 'some' | 'none';

/**
 * The one place that groups results by `matched_needs` (Decision 56: the client decides the
 * grouping). Returns one group per hit, in the hits' order; it never reorders (the server order
 * stays). `null` means "no group": no needs were selected, or the hit carries no `matched_needs`.
 */
export function groupByMatchedNeeds(
  hits: readonly { matched_needs?: readonly string[] }[],
  selectedNeeds: readonly string[],
): (NeedsGroup | null)[] {
  const selected = new Set(selectedNeeds);
  return hits.map((hit) => {
    if (selected.size === 0 || !hit.matched_needs) return null;
    const matched = new Set(hit.matched_needs.filter((c) => selected.has(c)));
    if (matched.size === 0) return 'none';
    return matched.size === selected.size ? 'all' : 'some';
  });
}

/** Answers that belong to one query text (Decision 51). */
const PER_QUERY = ['urgency', 'needs', 'passed_needs'] as const;

export type V2Changes = Record<string, string | string[] | null>;

/**
 * The next page URL for a set of changes. A new query text drops `urgency`, `needs` and
 * `passed_needs` (Decision 51), unless the same change sets them again. The page number resets.
 */
export function nextV2Params(
  current: Pick<URLSearchParams, 'get' | 'toString'>,
  changes: V2Changes,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  const text = (value: V2Changes[string]) =>
    Array.isArray(value) ? value.join(',') : value;
  if ('query' in changes) {
    const before = (current.get('query') ?? '').trim();
    const after = (text(changes.query) ?? '').trim();
    if (before !== after) {
      for (const key of PER_QUERY) if (!(key in changes)) next.delete(key);
    }
  }
  for (const [key, value] of Object.entries(changes)) {
    const v = text(value);
    if (v === null || v === '') next.delete(key);
    else next.set(key, v);
  }
  next.delete('page');
  return next;
}

/**
 * The URL changes for one answer. Each picked option writes its own `parameter` (Decision 55).
 * The need options left unpicked join `passed_needs`, so the rules engine does not offer them again.
 * A Skip or "None of these" on a question with urgency options writes U-X ("not known").
 */
export function answerChanges(
  question: V2Question,
  picked: readonly string[],
  state: { needs: string[]; passedNeeds: string[] },
): V2Changes {
  const chosen = question.options.filter((o) => picked.includes(o.value));
  const changes: V2Changes = {};
  const needs = new Set(state.needs);
  const passed = new Set(state.passedNeeds);
  for (const option of chosen) {
    if (option.parameter === 'needs') {
      needs.add(option.value);
      passed.delete(option.value);
    }
    if (option.parameter === 'passed_needs') passed.add(option.value);
    // The page never writes U-0 (Decision 54: no such option); a person in danger taps a number.
    if (option.parameter === 'urgency' && option.value !== 'U-0') {
      changes.urgency = option.value;
    }
  }
  const needOptions = question.options.filter((o) => o.parameter === 'needs');
  for (const option of needOptions) {
    if (!picked.includes(option.value)) passed.add(option.value);
  }
  const hasUrgency = question.options.some((o) => o.parameter === 'urgency');
  if (hasUrgency && !('urgency' in changes) && chosen.length === 0) {
    changes.urgency = 'U-X';
  }
  if (needOptions.length || chosen.some((o) => o.parameter === 'needs')) {
    changes.needs = [...needs];
  }
  if (
    needOptions.length ||
    chosen.some((o) => o.parameter === 'passed_needs')
  ) {
    changes.passed_needs = [...passed];
  }
  return changes;
}

/**
 * The question to show now. An emergency question the person skipped (its id in `asked`) stays as
 * the hotline numbers only, so the next question comes after it.
 */
export const nextQuestionOf = (
  response: V2Response | undefined,
  asked: readonly string[],
) =>
  response?.clarification.questions.find(
    (q) => !(q.type === 'emergency' && asked.includes(q.id)),
  );

/** `needs=` never carries N-X: it means "not yet known" and the route answers 400 (Decision 43). */
export const withoutNX = (needs: string | null) => {
  const kept = (needs ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && v !== 'N-X');
  return kept.length ? kept.join(',') : null;
};

/** At most this many guided questions before the results (Lucas, round 10). */
export const MAX_GUIDED = 3;
