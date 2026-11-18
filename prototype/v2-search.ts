// Prototype only. A local stand-in for Norse-API `GET /v2/search`, shaped like the OpenAPI draft
// (ArchitectureDocs proposed-changes/v2-search/openapi-v2-search.draft.yaml, ADR 0039). Two parts are real, one is fake:
// - real: ml-broker `search-classification` (needs, urgency, emergency scores), called over HTTP;
// - real: the Norse-API v2 rules engine (`decide`, `finalize`), imported from its branch checkout;
// - fake: the services. They come from the synthetic CATALOG in sune.mjs, not from Elasticsearch.
// Needs never filter. A confirmed or sure need only boosts, as the contract says.
import qs from 'qs';
import { CATALOG, dangerBand } from '../src/app/(app)/features/search/sune-demo/sune.mjs';

const RULES_PATH =
  process.env.RULES_ENGINE_PATH ??
  new URL('../../../NorseApiWorktree-rules/src/v2/rules/index.ts', import.meta.url).pathname;
const ML_BROKER_URL = process.env.ML_BROKER_URL ?? 'http://127.0.0.1:8010';
const ML_BROKER_KEY = process.env.ML_BROKER_KEY ?? 'proto-local';
const CLASSIFY_TIMEOUT_MS = Number(process.env.CLASSIFY_TIMEOUT_MS ?? 1500);

type Service = (typeof CATALOG)[number];
type Rules = typeof import('../../../NorseApiWorktree-rules/src/v2/rules/index');
let rules: Rules | undefined;
const loadRules = async () => (rules ??= (await import(RULES_PATH)) as Rules);

const URGENCY = new Set(['U-0', 'U-1', 'U-2', 'U-3', 'U-4', 'U-X']);
// Tenant context (Norse-API PR #332). The API reads `hotlines` from the tenant's search config and
// `top_areas` from the index, and the rules engine falls back to 988 and 911 and to Housing, Food,
// Money when they are absent (Lucas, 2026-11-12). The stub sends the same defaults, 988 first.
// STUB_TENANT_CONTEXT='{"hotlines":[...],"top_areas":[...]}' overrides them, `{}` tests the fallback.
const DEFAULT_HOTLINES = [
  { label: 'Crisis line', number: '988' },
  { label: 'Emergency', number: '911' },
];
const DEFAULT_TOP_AREAS = ['N-HOU', 'N-FOD', 'N-MON'];
const TENANT_CONTEXT: { hotlines?: { label: string; number: string }[]; top_areas?: string[] } =
  process.env.STUB_TENANT_CONTEXT
    ? JSON.parse(process.env.STUB_TENANT_CONTEXT)
    : { hotlines: DEFAULT_HOTLINES, top_areas: DEFAULT_TOP_AREAS };
const HOTLINES = TENANT_CONTEXT.hotlines?.length ? TENANT_CONTEXT.hotlines : DEFAULT_HOTLINES;
const STOP = new Set(['the', 'and', 'for', 'with', 'need', 'help', 'have', 'want', 'get', 'can', 'not', 'dont', "don't", 'my', 'me', 'i', 'a', 'to', 'of', 'in', 'some', 'any']);

export type V2Params = {
  query: string;
  needs: string[];
  passedNeeds: string[];
  urgency?: string;
  clarify: 'auto' | 'never';
  /** Facet filters (`filters[k]=v`, `filters[k][0]=v`). Lucas 2026-11-18 (1A): values of one facet are OR, different facets are AND. Norse-API PR #326 tests AND today; the API must change. */
  filters: Record<string, string[]>;
  /** Area search (Norse-API PR #327). */
  region: string[];
  areaMatch?: string;
  unlocated?: string;
};

const list = (value: string | null) =>
  [...new Set((value ?? '').split(',').map((v) => v.trim()).filter(Boolean))];

/** The URL parameters in the draft v2 names. `taxonomy` (topic pages, old links) reads as `needs`. */
export function readParams(params: URLSearchParams): V2Params {
  const urgency = params.get('urgency')?.trim();
  return {
    query: (params.get('query') ?? params.get('q') ?? '').trim().slice(0, 512),
    needs: list(params.get('needs') ?? params.get('taxonomy')).filter((c) => c.startsWith('N-')),
    passedNeeds: list(params.get('passed_needs')),
    // A caller may send U-0 (Decision 50); the page never writes it. U-X counts as no answer (Decision 51).
    urgency: urgency && URGENCY.has(urgency) && urgency !== 'U-X' ? urgency : undefined,
    clarify: params.get('clarify') === 'never' ? 'never' : 'auto',
    filters: readFilters(params),
    region: list(params.getAll('region').join(',')),
    areaMatch: params.get('area_match') || undefined,
    unlocated: params.get('unlocated') || undefined,
  };
}

/** `filters[languages]=Spanish`, `filters[age_group][0]=a` and `filters[age_group][]=a` all read as lists. */
function readFilters(params: URLSearchParams): Record<string, string[]> {
  const pairs = [...params.entries()].filter(([k]) => k.startsWith('filters['));
  const parsed = qs.parse(pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&'));
  const out: Record<string, string[]> = {};
  for (const [key, value] of Object.entries((parsed.filters ?? {}) as Record<string, unknown>)) {
    const values = (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string' && v !== '');
    if (values.length) out[key] = values;
  }
  return out;
}

/**
 * Facet fixtures for the synthetic catalog, in the real keys: `languages` and `age_group`. Spanish
 * on every third service, Vietnamese on every fifth; the age group from the service's `only` codes.
 */
export function facetValuesOf(service: Service): Record<string, string[]> {
  const n = Number(service.id);
  const only: string[] = service.only ?? [];
  return {
    languages: ['English', ...(n % 3 === 0 ? ['Spanish'] : []), ...(n % 5 === 0 ? ['Vietnamese'] : [])],
    age_group: only.includes('E-AGE-06') ? ['Seniors'] : only.includes('E-HH-01') ? ['Families with children'] : ['All ages'],
  };
}

const FACET_NAMES: Record<string, string> = { languages: 'Languages', age_group: 'Age group' };

/** The services that carry at least one ticked value of every ticked facet (OR inside a facet, AND across facets). */
export function applyFacetFilters<T extends Service>(services: T[], filters: Record<string, string[]>): T[] {
  return services.filter((s) => {
    const have = facetValuesOf(s);
    return Object.entries(filters).every(([key, wanted]) => wanted.some((v) => have[key]?.includes(v)));
  });
}

/**
 * The facet list of a filtered search. Values of one facet are OR, so each facet counts over the services that
 * pass every OTHER facet's filter, never its own: the count beside a value is what ticking it would show.
 */
export function facetsOfFiltered(all: Service[], filters: Record<string, string[]>) {
  const lists = new Map(
    Object.keys(FACET_NAMES).map((key) => {
      const { [key]: _own, ...others } = filters;
      return [key, facetsOf(applyFacetFilters(all, others)).find((f) => f.key === key)!] as const;
    }),
  );
  return Object.keys(FACET_NAMES).map((key) => lists.get(key)!);
}

/** v1/v2 facet list for a result set: `[{ key, name, values: [{ en, locale, doc_count }] }]`, biggest count first. */
export function facetsOf(services: Service[]) {
  return Object.keys(FACET_NAMES).map((key) => {
    const counts = new Map<string, number>();
    for (const s of services) for (const v of facetValuesOf(s)[key] ?? []) counts.set(v, (counts.get(v) ?? 0) + 1);
    const values = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([v, doc_count]) => ({ en: v, locale: v, doc_count }));
    return { key, name: { en: FACET_NAMES[key], locale: FACET_NAMES[key] }, values };
  });
}

// Known Regions of the stub. Any other id is a 400, as in Norse-API (PR #327).
const REGIONS: Record<string, { type: string; name: string; state: string }> = {
  'county:53073': { type: 'county', name: 'Whatcom County, WA', state: 'WA' },
  'county:53077': { type: 'county', name: 'Yakima County, WA', state: 'WA' },
  'zip:98225': { type: 'zip', name: '98225 (Bellingham, WA)', state: 'WA' },
};

/** The `resolved_location` of an area search, or `undefined` with no `region`. An unknown Region throws a 400. */
export function resolveRegions(params: Pick<V2Params, 'region' | 'areaMatch' | 'unlocated'>) {
  if (!params.region.length) return undefined;
  const unknown = params.region.filter((id) => !REGIONS[id]);
  if (unknown.length) throw Object.assign(new Error(`unknown region: ${unknown.join(', ')}`), { status: 400 });
  return {
    regions: params.region.map((id) => ({ id, ...REGIONS[id] })),
    area_match: ['located', 'located_or_serving', 'serving'].includes(params.areaMatch ?? '') ? params.areaMatch : 'located_or_serving',
    unlocated: ['none', 'virtual', 'all'].includes(params.unlocated ?? '') ? params.unlocated : 'virtual',
  };
}

type Classified = {
  needs: { status: 'ok' | 'error'; scores?: Record<string, number> };
  urgency?: { level: 'U-1' | 'U-2' | 'U-3' | 'U-4'; score: number };
  emergency: { status: 'ok' | 'error'; score?: number; floor_hit?: boolean; calm_context?: boolean; dv_shelter?: boolean } | null;
  modelVersion?: string;
  ms: number;
};

/** One ml-broker call. A timeout or an error gives `status: 'error'`; the search still runs. */
async function classify(query: string): Promise<Classified> {
  const started = Date.now();
  if (!query) return { needs: { status: 'ok', scores: {} }, emergency: null, ms: 0 };
  try {
    const res = await fetch(`${ML_BROKER_URL}/api/v1/tasks/search-classification/predict`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ML_BROKER_KEY },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(CLASSIFY_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`ml-broker ${res.status}`);
    const body = await res.json();
    const scores: Record<string, number> = {};
    for (const s of body.needs.scores) scores[s.code] = s.score;
    const e = body.emergency;
    return {
      needs: { status: 'ok', scores },
      urgency: { level: body.urgency.level, score: body.urgency.score },
      emergency: e.status === 'ok'
        ? { status: 'ok', score: e.score, floor_hit: e.floor_hit, calm_context: e.calm_context, dv_shelter: e.dv_shelter }
        : { status: 'error' },
      modelVersion: body.model_version,
      ms: Date.now() - started,
    };
  } catch (err) {
    console.warn('classify failed:', (err as Error).message);
    return { needs: { status: 'error' }, emergency: { status: 'error' }, ms: Date.now() - started };
  }
}

const familyOf = (code: string) => code.split('-').slice(0, 2).join('-');
const carries = (service: Service, code: string) =>
  service.needs.some((n: string) => n === code || familyOf(n) === code);
const words = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/**
 * The fake search. It stands in for keyword + kNN: a service is a match when its text shares a word
 * with the query or when the model scores one of its needs at 0.12 or more. Boosted needs and the
 * urgency only reorder. A query with words that matches nothing returns no services (Decision 49).
 */
function search(query: string, sentNeeds: string[], boostNeeds: string[], scores: Record<string, number>, urgency?: string) {
  const qWords = words(query);
  const ranked = CATALOG.map((service: Service) => {
    const text = `${service.name} ${service.org} ${service.summary}`.toLowerCase();
    const textHits = qWords.filter((w) => text.includes(w)).length;
    const model = Math.max(0, ...service.needs.map((n: string) => Math.max(scores[n] ?? 0, (scores[familyOf(n)] ?? 0) * 0.5)));
    const boost = boostNeeds.filter((code) => carries(service, code)).length;
    const soon = urgency && service.urgency.includes(urgency) ? 0.5 : 0;
    // Decision 56: the sent needs= codes this service carries, in the order sent.
    const matchedNeeds = sentNeeds.filter((code) => carries(service, code));
    return { service, matchedNeeds, match: textHits > 0 || model >= 0.12 || matchedNeeds.length > 0, score: textHits + 2 * model + 3 * boost + soon };
  });
  const matched = ranked.filter((r) => r.match);
  // Decision 49: the list is empty only when the query itself matches nothing. A query with no content words still ranks the catalog.
  const pool = matched.length || qWords.length ? matched : ranked;
  // Decision 18: every sent need first, then some, then none; the boost orders inside each group.
  const group = (r: (typeof ranked)[number]) =>
    r.matchedNeeds.length === sentNeeds.length ? 0 : r.matchedNeeds.length > 0 ? 1 : 2;
  pool.sort((a, b) => (sentNeeds.length ? group(a) - group(b) : 0) || b.score - a.score || Number(a.service.id) - Number(b.service.id));
  return { services: pool.map((r) => ({ ...r.service, matchedNeeds: r.matchedNeeds })), strongTextMatch: CATALOG.some((s: Service) => query.length >= 6 && s.org.toLowerCase() === query.toLowerCase()) };
}

type Option = { label: string; parameter: 'needs' | 'passed_needs' | 'urgency'; value: string; results_count?: number | null };
type EngineQuestion = Record<string, unknown> & {
  id: string; type: string; level?: string; parameter?: Option['parameter'];
  options: (Omit<Option, 'parameter'> & { parameter?: Option['parameter'] })[];
  hotlines?: { label: string; number: string }[];
};

/**
 * The engine on the rules branch may still emit the older question shape. This brings it to the
 * draft: `parameter` on each option (Decision 55), no U-0 option on the
 * emergency question (Decision 54), no `level`, no N-X option (Decision 43). A newer engine passes through.
 */
function toContractQuestion(q: EngineQuestion, band: string): Record<string, unknown> {
  // The API stops sending `level` (the page reads `type` and `importance`), so the stub drops it too.
  const { parameter, level: _level, ...rest } = q as EngineQuestion & { importance?: string };
  const options = q.options
    .filter((o) => o.value !== 'N-X' && !(q.type === 'emergency' && o.value === 'U-0'))
    .map((o) => ({ ...o, parameter: o.parameter ?? parameter ?? 'needs' }));
  // The soft band (middle danger) was `level: orange`; the page now reads `importance` for it.
  const importance = q.type === 'emergency' && band === 'soft' ? 'high' : rest.importance;
  return { ...rest, importance, options };
}

/** A caller `urgency=U-0` (Decision 50): the emergency question as a popup with the numbers, no options. */
const callerEmergencyQuestion = (hotlines: { label: string; number: string }[]) => ({
  id: 'emergency', type: 'emergency', importance: 'critical', value: 0.999, priority: 3.999,
  uncertainty: 0, reason: 'emergency_band', step: 0, stem: 'Help is one call away.', options: [],
  multi_select: false, allow_other: false, none_of_these: false, hotlines,
});

/** Lucas 2026-11-18: the red popup asks one question with exactly these three answers. */
const EMERGENCY_OPTIONS = [
  { label: 'Yes, I am in danger', parameter: 'urgency', value: 'U-0', results_count: null },
  { label: 'No, I am safe, I need help today', parameter: 'urgency', value: 'U-1', results_count: null },
  { label: 'No, I am safe, I need help this week', parameter: 'urgency', value: 'U-2', results_count: null },
];
const criticalEmergencyQuestion = () => ({
  id: 'emergency', type: 'emergency', importance: 'critical', value: 0.999, priority: 3.999,
  uncertainty: 0, reason: 'emergency_band', step: 0, stem: 'Are you in danger right now?',
  options: EMERGENCY_OPTIONS, multi_select: false, allow_other: false, none_of_these: false, hotlines: HOTLINES,
});

/**
 * Display rules of the red emergency question. urgency=U-1..U-4: no emergency question (no popup).
 * urgency=U-0: the caller question, no options (call buttons). Otherwise a critical question
 * carries the three options, and a crisis query the engine missed (ml-broker down) still gets one.
 */
function applyEmergencyDisplay(questions: Record<string, unknown>[], urgency: string | undefined, crisis: boolean) {
  if (urgency === 'U-0') return questions;
  if (urgency && urgency !== 'U-X') return questions.filter((q) => q.type !== 'emergency');
  const has = questions.some((q) => q.type === 'emergency');
  if (!has && crisis) return [criticalEmergencyQuestion(), ...questions].slice(0, 3);
  return questions.map((q) =>
    q.type === 'emergency' && q.importance === 'critical' ? { ...q, options: EMERGENCY_OPTIONS } : q);
}

export async function v2Search(params: V2Params) {
  const started = Date.now();
  const { decide, finalize } = await loadRules();
  const text = params.query.slice(0, 512);
  const signals = await classify(text);
  // U-0 goes to the engine as no answer, so it does not plan time questions around it.
  const engineUrgency = params.urgency === 'U-0' ? undefined : params.urgency;
  const decision = decide(
    { has_text: Boolean(text), needs: params.needs, passed_needs: params.passedNeeds, urgency: engineUrgency as never, clarify: params.clarify },
    { needs: signals.needs, urgency: signals.urgency, emergency: signals.emergency },
    TENANT_CONTEXT,
  );
  const boost = [...new Set([...params.needs, ...decision.boost_needs])];
  const urgency = params.urgency ?? (decision.urgency.state === 'use' ? decision.urgency.value : undefined);
  const resolvedLocation = resolveRegions(params);
  const { services: allServices, strongTextMatch } = search(text, params.needs, boost, signals.needs.scores ?? {}, urgency);
  // Facet filters DO filter (needs never do). Facet counts leave out each facet's own filter (OR inside a facet).
  const services = applyFacetFilters(allServices, params.filters);
  const byCode: Record<string, number> = {};
  for (const code of decision.count_codes) byCode[code] = services.filter((s) => carries(s, code)).length;
  const engine = finalize(decision, { counts: { total: services.length, by_code: byCode }, strong_text_match: strongTextMatch });
  const band = (decision as { emergency_band?: string }).emergency_band ?? 'none';
  let questions = (engine.questions as unknown as EngineQuestion[]).map((q) => toContractQuestion(q, band));
  if (params.urgency === 'U-0') {
    questions = [callerEmergencyQuestion(HOTLINES), ...questions.filter((q) => q.type !== 'emergency')].slice(0, 3);
  }
  questions = applyEmergencyDisplay(questions, params.urgency, dangerBand(text, []) === 'high' || band === 'strong') as typeof questions;
  return {
    services,
    body: {
      facets: facetsOfFiltered(allServices, params.filters),
      ...(resolvedLocation && { resolved_location: resolvedLocation }),
      intent: {
        query: params.query || null,
        needs: decision.needs.map((n) => ({ value: n.code, state: n.state, source: n.source, confidence: n.confidence })),
        urgency: params.urgency === 'U-0' ? { value: 'U-0', source: 'caller', state: 'use' } : decision.urgency,
      },
      clarification: { rules_version: engine.rules_version, questions },
      model_version: signals.modelVersion ?? null,
      rules_version: decision.rules_version,
      prototype: {
        services: 'synthetic catalog',
        classifier: signals.needs.status === 'ok' ? 'ml-broker (real)' : 'ml-broker unavailable',
        emergency_band: band,
        timing_ms: { classify: signals.ms, total: Date.now() - started },
      },
    },
  };
}
