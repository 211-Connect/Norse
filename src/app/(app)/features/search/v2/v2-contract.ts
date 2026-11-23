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
  /** Plain one-line meaning of the option, from the server. Absent: the card shows no info icon. */
  description?: string | null;
  /** Services that carry this need; null or absent when not counted (Decision 46). */
  results_count?: number | null;
};

export type V2Hotline = { label: string; number: string };

/** What a question asks about (contract v2). */
export type V2QuestionType = 'emergency' | 'urgency' | 'need';
/** Legacy type names, sent while the API is older than contract v2. */
export type V2LegacyQuestionType = 'confirm_urgency' | 'find_need' | 'narrow';
/** Where a question shows: over everything, on the find page, or beside the results. */
export type V2Placement = 'popup' | 'before_results' | 'with_results';
/** How loud a question looks. */
export type V2Style = 'strong' | 'standard' | 'subtle';

export type V2Question = {
  id: string;
  type: V2QuestionType | V2LegacyQuestionType;
  /** Absent on a legacy response (API older than contract v2); see `placementOf`. */
  placement?: V2Placement;
  style?: V2Style;
  /** Legacy fields: read only by the fallback in `placementOf` / `styleOfQuestion`. */
  importance?: 'critical' | 'high' | 'medium' | 'low';
  value?: number;
  priority?: number;
  uncertainty?: number;
  reason?: string;
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

/** One facet of the v2 response: the same shape as v1 (Norse-API ISS-2499, PR #326). */
export type V2Facet = {
  key: string;
  name: { en: string; locale: string };
  values: { en: string; locale: string; doc_count: number }[];
};

/** A Region of an area search (Norse-API PR #327). */
export type V2Region = {
  id: string;
  type?: string;
  name: string;
  state?: string;
};

/** Where an area search (`region`) was scoped. Absent for `coords` searches. */
export type V2ResolvedLocation = {
  regions: V2Region[];
  area_match: 'located' | 'located_or_serving' | 'serving';
  unlocated: 'none' | 'virtual' | 'all';
};

/** The words the API sends beside the questions (contract v2). */
export type V2Strings = {
  popup_title?: string;
  skip_to_results?: string;
  also_fit_one?: string;
};

export type V2Response = {
  /** Facet counts for the current filters. v1 shape; absent or `{}` from older servers and stubs. */
  facets?: V2Facet[] | Record<string, never>;
  /** Area searches only (`region`). */
  resolved_location?: V2ResolvedLocation;
  search: {
    hits: { total?: { value: number } | number; hits: V2Hit[] };
  };
  /**
   * True when the text found no good match (Norse-API ISS-2796). Without `needs` the results are
   * empty and the one `no_match` question asks what the person needs. With `needs` the results
   * are the services that carry them, ranked without the text. Absent from older servers.
   */
  weak_match?: boolean;
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
  clarification: {
    rules_version: string;
    questions: V2Question[];
    /** Words from the API string table (request locale). Absent on a legacy response. */
    strings?: V2Strings;
  };
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

/** Legacy type names count as the new ones. */
export const canonicalType = (
  type: V2Question['type'] | undefined,
): V2QuestionType =>
  type === 'emergency'
    ? 'emergency'
    : type === 'urgency' || type === 'confirm_urgency'
      ? 'urgency'
      : 'need';

type PlacementInput = Pick<V2Question, 'type'> &
  Partial<Pick<V2Question, 'placement' | 'style' | 'importance'>>;

/**
 * The one place that decides where a question shows: the API's `placement` when present.
 * FALLBACK (remove when dev runs PR 2): without `placement` the old `importance` decides.
 * critical -> popup, high -> before_results, medium or low -> with_results.
 */
export function placementOf(q: PlacementInput): V2Placement {
  if (q.placement) return q.placement;
  if (q.importance === 'critical') return 'popup';
  if (q.importance === 'high') return 'before_results';
  return 'with_results';
}

/**
 * The one place that decides how loud a question looks: the API's `style` when present.
 * FALLBACK (remove when dev runs PR 2): without `style` the old `importance` decides.
 * critical -> strong, high -> standard (strong for the soft emergency band), else subtle.
 */
export function styleOfQuestion(q: PlacementInput): V2Style {
  if (q.style) return q.style;
  if (q.importance === 'critical') return 'strong';
  if (q.importance === 'high') {
    return canonicalType(q.type) === 'emergency' ? 'strong' : 'standard';
  }
  return 'subtle';
}

/** True for a response from an API older than contract v2 (no `placement` on the question). */
export const isLegacyQuestion = (q: Pick<V2Question, 'placement'>) =>
  q.placement === undefined;

/** The look of a question card: red for the emergency question, else the question's `style`. */
export type QuestionStyle = 'emergency' | V2Style;

/** Red for the emergency question; otherwise strong, standard (orange) or subtle (quiet). */
export const styleOf = (q: PlacementInput): QuestionStyle =>
  canonicalType(q.type) === 'emergency' ? 'emergency' : styleOfQuestion(q);

/** The soft emergency band is the calmer orange card, shown before the results (not a popup). */
export const isSoftEmergency = (q?: PlacementInput) =>
  Boolean(q) && placementOf(q!) !== 'popup';

/** Words from the API; the English is the legacy fallback for a response with no `strings`. */
export function stringsOf(response?: Pick<V2Response, 'clarification'>) {
  const s = response?.clarification?.strings;
  return {
    // Legacy fallback (remove when dev runs PR 2): English when the API sends no strings.
    popupTitle: s?.popup_title || 'Are you in danger right now?',
    skipToResults: s?.skip_to_results || 'Skip to results',
    alsoFitOne: s?.also_fit_one || 'Does this also fit?',
  };
}

/** The id of the one question a weak match asks (Norse-API ISS-2796). */
export const NO_MATCH_ID = 'no_match';

/** A weak match with no need picked yet: no results, and the `no_match` question is the way on. */
export const isWeakMatch = (response?: V2Response) =>
  response?.weak_match === true;

export const noMatchQuestionOf = (response?: V2Response) =>
  response?.clarification.questions.find((q) => q.id === NO_MATCH_ID);

/** The three answers of the red emergency popup (Lucas, 2026-11-18). Each writes `urgency=`. */
export const EMERGENCY_ANSWERS = [
  { label: 'Yes, I am in danger', value: 'U-0' },
  { label: 'No, I am safe, I need help today', value: 'U-1' },
  { label: 'No, I am safe, I need help this week', value: 'U-2' },
] as const;

/**
 * The popup's question with exactly the three answers. The rules engine's options win when they
 * carry all three codes (its labels and order); otherwise the page's own are used.
 */
export function withEmergencyAnswers(q: V2Question): V2Question {
  const mine = EMERGENCY_ANSWERS.map((a) => {
    const engine = q.options.find(
      (o) => o.parameter === 'urgency' && o.value === a.value,
    );
    return engine ? { ...engine } : undefined;
  });
  const options = mine.every(Boolean)
    ? (mine as V2Question['options'])
    : EMERGENCY_ANSWERS.map((a) => ({
        label: a.label,
        parameter: 'urgency' as const,
        value: a.value,
        results_count: null,
      }));
  return { ...q, options };
}

/**
 * Which red popup to show. `danger`: the URL says U-0, so the call buttons show. `ask`: the three
 * answers. null: soft band, or an urgency U-1 to U-4 is already in the URL (no popup, Lucas FINAL
 * 2026-11-17), or the question was skipped before (`asked`).
 */
export function emergencyPopupMode(
  q: (Pick<V2Question, 'id'> & PlacementInput) | undefined,
  urgency: string | null | undefined,
  asked: readonly string[],
): 'ask' | 'danger' | null {
  if (!q || isSoftEmergency(q)) return null;
  if (urgency === 'U-0') return 'danger';
  if (urgency && urgency !== 'U-X') return null;
  return asked.includes(q.id) ? null : 'ask';
}

/** A safe answer is in the URL (U-1 to U-4): the person answered the emergency question. */
export const isUrgencyAnswered = (urgency?: string | null) =>
  Boolean(urgency) && urgency !== 'U-0' && urgency !== 'U-X';

export const emergencyQuestionOf = (response?: V2Response) =>
  response?.clarification.questions.find(
    (q) => canonicalType(q.type) === 'emergency',
  );

const MAX_HOTLINES = 4;

/**
 * The numbers to show with the emergency question: the tenant's `hotlines[]` from the response
 * (Norse-API PR #332 puts them on the emergency question only), trimmed, entries without a label
 * and number dropped, at most 4. Nothing usable gives none: the UI has no default list
 * (contract v2), so no call buttons show.
 */
export function hotlinesOf(q?: Pick<V2Question, 'hotlines'>): V2Hotline[] {
  const raw: unknown = q?.hotlines;
  const kept: V2Hotline[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const { label, number } = (item ?? {}) as Record<string, unknown>;
      if (typeof label !== 'string' || typeof number !== 'string') continue;
      if (label.trim() && number.trim()) {
        kept.push({ label: label.trim(), number: number.trim() });
      }
      if (kept.length === MAX_HOTLINES) break;
    }
  }
  return kept;
}

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
const PER_QUERY = ['urgency', 'needs', 'passed_needs', 'asked'] as const;

export type V2Changes = Record<string, string | string[] | null>;

/**
 * The next page URL for a set of changes. A new query text drops `urgency`, `needs`, `passed_needs`
 * and `asked` (Decision 51), unless the same change sets them again. The page number resets.
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
    // The emergency popup writes U-0 ("Yes, I am in danger"), U-1 and U-2 (Lucas, 2026-11-18).
    if (option.parameter === 'urgency') {
      changes.urgency = option.value;
    }
  }
  const needOptions = question.options.filter((o) => o.parameter === 'needs');
  // The no_match options are guesses, not areas the person turned down: leaving one unpicked
  // must not hide it from the next question.
  const isNoMatch = question.id === NO_MATCH_ID;
  if (!isNoMatch) {
    for (const option of needOptions) {
      if (!picked.includes(option.value)) passed.add(option.value);
    }
  }
  const hasUrgency = question.options.some((o) => o.parameter === 'urgency');
  if (hasUrgency && !('urgency' in changes) && chosen.length === 0) {
    changes.urgency = 'U-X';
  }
  if (needOptions.length || chosen.some((o) => o.parameter === 'needs')) {
    changes.needs = [...needs];
  }
  if (
    (!isNoMatch && needOptions.length) ||
    chosen.some((o) => o.parameter === 'passed_needs')
  ) {
    changes.passed_needs = [...passed];
  }
  return changes;
}

/**
 * The URL changes for typed "Other" text. The text joins `query` (Decision 7); there is no `other`
 * parameter. A new query text would drop the answers (Decision 51), so the current `needs`,
 * `passed_needs` and `urgency` are written again here. On the `no_match` question nothing else is
 * written, so the question can come again if the text is still not enough; elsewhere the text
 * answers like a Skip.
 */
export function otherChanges(
  question: V2Question | undefined,
  currentQuery: string | null,
  text: string,
  state: { needs: string[]; passedNeeds: string[]; urgency?: string | null },
): V2Changes {
  const keep: V2Changes = {
    query: [currentQuery?.trim(), text.trim()].filter(Boolean).join('. '),
    query_label: null,
    needs: [...state.needs],
    passed_needs: [...state.passedNeeds],
    urgency: state.urgency ?? null,
  };
  if (!question || question.id === NO_MATCH_ID) return keep;
  return { ...keep, ...answerChanges(question, [], state) };
}

/**
 * The question to show now. An emergency question the person skipped (its id in `asked`) stays as
 * the hotline numbers only, so the next question comes after it.
 */
export const nextQuestionOf = (
  response: V2Response | undefined,
  asked: readonly string[],
  /** Only questions with one of these placements (the guide and the refine card each take theirs). */
  placements?: readonly V2Placement[],
) =>
  response?.clarification.questions.find(
    (q) =>
      !(canonicalType(q.type) === 'emergency' && asked.includes(q.id)) &&
      (!placements || placements.includes(placementOf(q))),
  );

/** The refine card beside the results takes `with_results` questions. */
export const REFINE_PLACEMENTS: readonly V2Placement[] = ['with_results'];
/** The guided find page takes the popup (emergency) and `before_results` questions. */
export const GUIDE_PLACEMENTS: readonly V2Placement[] = [
  'popup',
  'before_results',
];

/** `needs=` never carries N-X: it means "not yet known" and the route answers 400 (Decision 43). */
export const withoutNX = (needs: string | null) => {
  const kept = (needs ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v && v !== 'N-X');
  return kept.length ? kept.join(',') : null;
};

/**
 * The rules engine asks one area at a time, so a question can offer a single need (live NY run
 * 2026-11-16: 66 of 198 searches). "Pick all that fit" over one checkbox reads wrong, so the page
 * shows it as a one-tap question: not multi-select, and "Do any of these also fit?" becomes
 * `strings.also_fit_one` ("Does this also fit?"). Two or more options keep the engine's wording.
 */
export function cardWording(
  q: Pick<V2Question, 'stem' | 'multi_select' | 'options'>,
  alsoFitOne: string = stringsOf().alsoFitOne,
): {
  text: string;
  multi: boolean;
} {
  const single = q.options.filter((o) => o.parameter === 'needs').length === 1;
  if (!single) return { text: q.stem, multi: q.multi_select };
  return {
    // Legacy stem only (a contract v2 stem is already the right words); the words come from the API.
    text: q.stem === 'Do any of these also fit?' ? alsoFitOne : q.stem,
    multi: false,
  };
}

/**
 * The facets of a v2 response as the filter panel reads them (`FiltersMap`): the bucket key is the
 * English value (the one `filters[...]` sends), the display text is the tenant language. A facet with
 * no values is left out. `undefined` when the response carries no facet list, so the page can keep
 * the v1 facets it already has.
 */
export function facetsToFilters(
  facets: V2Response['facets'],
  active: Record<string, string[]> = {},
):
  | Record<
      string,
      {
        name: string;
        buckets: { key: string; display: string; doc_count: number }[];
      }
    >
  | undefined {
  if (!Array.isArray(facets)) return undefined;
  const out: Record<
    string,
    {
      name: string;
      buckets: { key: string; display: string; doc_count: number }[];
    }
  > = {};
  for (const facet of facets) {
    if (
      !facet?.key ||
      !Array.isArray(facet.values) ||
      facet.values.length === 0
    )
      continue;
    out[facet.key] = {
      name: facet.name?.locale || facet.name?.en || facet.key,
      buckets: facet.values.map((v) => ({
        key: v.en,
        display: v.locale || v.en,
        doc_count: v.doc_count,
      })),
    };
  }
  // A ticked value the filtered counts no longer list stays in the panel with 0, so it can be unticked.
  for (const [key, values] of Object.entries(active)) {
    const group = out[key];
    if (!group) continue;
    for (const value of values) {
      if (!group.buckets.some((b) => b.key === value)) {
        group.buckets.push({ key: value, display: value, doc_count: 0 });
      }
    }
  }
  return out;
}

/**
 * The ticked filter values of a page URL: `filters[k]=v`, `filters[k][0]=v`, `filters[k][]=v`
 * (what `filters[...]` in the v2 query reads), as `{ k: [v, ...] }`.
 */
export function activeFiltersOf(
  params: Pick<URLSearchParams, 'entries'>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, value] of v2FilterPairs(params)) {
    const m = /^filters\[([^\]]+)\]/.exec(key);
    if (!m) continue;
    const list = (out[m[1]] ??= []);
    if (!list.includes(value)) list.push(value);
  }
  return out;
}

/** "Showing results near Jackson County, MO": the Regions an area search was scoped to. */
export function locationNote(resolved?: V2ResolvedLocation): string | null {
  const names = (resolved?.regions ?? [])
    .map((r) => r?.name?.trim())
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return null;
  const list =
    names.length <= 2
      ? names.join(' and ')
      : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
  return `Showing results near ${list}`;
}

/** Page URL keys that go to `/v2/search` as they are: the filter params and the area params. */
export const V2_PASSTHROUGH_KEYS = [
  'age',
  'organization_id',
  'geo_type',
  'region',
  'area_match',
  'unlocated',
] as const;

/** `filters[languages]`, `filters[age_group][0]`, `filters[age_group][]`. Nothing else is a filter key. */
export const FILTER_KEY = /^filters\[[A-Za-z0-9_.-]{1,64}\](\[\d{0,3}\])?$/;
const MAX_FILTER_PAIRS = 60;

/**
 * Every result-changing parameter of a page URL that `/v2/search` reads and the call has no named
 * key for: the `filters[...]` pairs (sorted, so the same filters are one cache key) and the
 * pass-through keys, repeated values kept. Facet filters DO filter; `needs=` never does (ADR 0039).
 */
export function v2FilterPairs(
  params: Pick<URLSearchParams, 'entries'>,
): [string, string][] {
  const filters: [string, string][] = [];
  const other: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    if (!value) continue;
    if (FILTER_KEY.test(key)) filters.push([key, value]);
    else if ((V2_PASSTHROUGH_KEYS as readonly string[]).includes(key))
      other.push([key, value]);
  }
  filters.sort(([a, av], [b, bv]) =>
    a === b ? av.localeCompare(bv) : a.localeCompare(b),
  );
  return [...other, ...filters.slice(0, MAX_FILTER_PAIRS)];
}

/** Show this many options first on every question; "Show more" reveals the rest (Lucas 2026-11-19). */
export const OPTION_LIMIT = 4;

/** Legacy only: a fake "None of these" option from an older API is never drawn (Lucas 2026-11-19). */
export const isNoneOption = (o: Pick<V2Option, 'label' | 'value'>) =>
  /^none( of (these|the above))?$/i.test(o.label.trim()) ||
  /^(none|none_of_these|no_match)$/i.test(o.value);

/**
 * The options the page may draw, at most `limit` until the person asks for more. "None of these"
 * is never drawn: the UI ignores the `none_of_these` flag (Lucas, 2026-11-23). Only a legacy question (no `placement`)
 * still carries a fake none option, so only then it is filtered out (remove when dev runs PR 2).
 */
export function visibleOptions<T extends Pick<V2Option, 'label' | 'value'>>(
  q: Pick<V2Question, 'placement'>,
  options: T[],
  showAll: boolean,
  limit: number = OPTION_LIMIT,
): { shown: T[]; hidden: number } {
  const real = isLegacyQuestion(q)
    ? options.filter((o) => !isNoneOption(o))
    : options;
  if (showAll || real.length <= limit) {
    return { shown: real, hidden: 0 };
  }
  return { shown: real.slice(0, limit), hidden: real.length - limit };
}

/** `none`: no number is drawn (null or absent). `zero`: drawn in red. `some`: drawn as usual. */
export const countTone = (
  count: number | null | undefined,
): 'none' | 'zero' | 'some' =>
  typeof count !== 'number' || !Number.isFinite(count)
    ? 'none'
    : count === 0
      ? 'zero'
      : 'some';

/** The option's description for the info icon: the trimmed text, or undefined when there is none. */
export const optionDescription = (
  option: Pick<V2Option, 'description'>,
): string | undefined => option.description?.trim() || undefined;
