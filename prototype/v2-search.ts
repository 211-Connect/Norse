// Prototype only. A local stand-in for Norse-API `GET /v2/search`, shaped like the draft contract
// (v2-search--api-contract artifact v19). Two parts are real, one is fake:
// - real: ml-broker `search-classification` (needs, urgency, emergency scores), called over HTTP;
// - real: the Norse-API v2 rules engine (`decide`, `finalize`), imported from its branch checkout;
// - fake: the services. They come from the synthetic CATALOG in sune.mjs, not from Elasticsearch.
// Needs never filter. A confirmed or sure need only boosts, as the contract says.
import { CATALOG } from '../src/app/(app)/features/search/sune-demo/sune.mjs';

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

const URGENCY = new Set(['U-1', 'U-2', 'U-3', 'U-4', 'U-X']);
const HOTLINES = [
  { label: 'Suicide and Crisis Lifeline', number: '988' },
  { label: 'Emergency', number: '911' },
];
const STOP = new Set(['the', 'and', 'for', 'with', 'need', 'help', 'have', 'want', 'get', 'can', 'not', 'dont', "don't", 'my', 'me', 'i', 'a', 'to', 'of', 'in', 'some', 'any']);

export type V2Params = {
  query: string;
  /** "Other" text a person typed as an answer. It joins the query for classify and search. */
  other: string;
  needs: string[];
  passedNeeds: string[];
  urgency?: string;
  clarify: 'auto' | 'never';
};

const list = (value: string | null) =>
  [...new Set((value ?? '').split(',').map((v) => v.trim()).filter(Boolean))];

/** The URL parameters in the draft v2 names. `taxonomy` (topic pages, old links) reads as `needs`. */
export function readParams(params: URLSearchParams): V2Params {
  const urgency = params.get('urgency')?.trim();
  return {
    query: (params.get('query') ?? params.get('q') ?? '').trim().slice(0, 512),
    other: (params.get('other') ?? '').trim().slice(0, 200),
    needs: list(params.get('needs') ?? params.get('taxonomy')).filter((c) => c.startsWith('N-')),
    passedNeeds: list(params.get('passed_needs')),
    // U-0 is refused here as in the URL: an emergency answer is never stored in a link.
    urgency: urgency && URGENCY.has(urgency) ? urgency : undefined,
    clarify: params.get('clarify') === 'never' ? 'never' : 'auto',
  };
}

type Classified = {
  needs: { status: 'ok' | 'error'; scores?: Record<string, number>; urgency?: { level: 'U-1' | 'U-2' | 'U-3' | 'U-4'; score: number } };
  emergency: { status: 'ok' | 'error'; score?: number; floorHit?: boolean; calmContext?: boolean; dvShelter?: boolean } | null;
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
      needs: { status: 'ok', scores, urgency: { level: body.urgency.level, score: body.urgency.score } },
      emergency: e.status === 'ok'
        ? { status: 'ok', score: e.score, floorHit: e.floor_hit, calmContext: e.calm_context, dvShelter: e.dv_shelter }
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
 * urgency only reorder. A query that matches nothing returns the whole catalog, ranked.
 */
function search(query: string, boostNeeds: string[], scores: Record<string, number>, urgency?: string) {
  const qWords = words(query);
  const ranked = CATALOG.map((service: Service) => {
    const text = `${service.name} ${service.org} ${service.summary}`.toLowerCase();
    const textHits = qWords.filter((w) => text.includes(w)).length;
    const model = Math.max(0, ...service.needs.map((n: string) => Math.max(scores[n] ?? 0, (scores[familyOf(n)] ?? 0) * 0.5)));
    const boost = boostNeeds.filter((code) => carries(service, code)).length;
    const soon = urgency && service.urgency.includes(urgency) ? 0.5 : 0;
    return { service, match: textHits > 0 || model >= 0.12, score: textHits + 2 * model + 3 * boost + soon };
  });
  const matched = ranked.filter((r) => r.match);
  const pool = matched.length ? matched : ranked;
  pool.sort((a, b) => b.score - a.score || Number(a.service.id) - Number(b.service.id));
  return { services: pool.map((r) => r.service), strongTextMatch: CATALOG.some((s: Service) => query.length >= 6 && s.org.toLowerCase() === query.toLowerCase()) };
}

export async function v2Search(params: V2Params) {
  const started = Date.now();
  const { decide, finalize } = await loadRules();
  const text = [params.query, params.other].filter(Boolean).join('. ').slice(0, 512);
  const signals = await classify(text);
  const decision = decide(
    { hasText: Boolean(text), needs: params.needs, passedNeeds: params.passedNeeds, urgency: params.urgency as never, clarify: params.clarify },
    { needs: signals.needs, emergency: signals.emergency },
    { topAreas: ['N-FOD', 'N-HOU', 'N-MON', 'N-HLT', 'N-SAF'], hotlines: HOTLINES },
  );
  const boost = [...new Set([...params.needs, ...decision.boostNeeds])];
  const urgency = params.urgency ?? (decision.urgency.state === 'use' ? decision.urgency.value : undefined);
  const { services, strongTextMatch } = search(text, boost, signals.needs.scores ?? {}, urgency);
  const byCode: Record<string, number> = {};
  for (const code of decision.countCodes) byCode[code] = services.filter((s: Service) => carries(s, code)).length;
  const clarification = finalize(decision, { counts: { total: services.length, byCode }, strongTextMatch });
  return {
    services,
    body: {
      intent: {
        query: params.query || undefined,
        needs: decision.needs.map((n) => ({ value: n.code, state: n.state, source: n.source, confidence: n.confidence })),
        passed_needs: params.passedNeeds,
        boost_needs: boost,
        urgency: decision.urgency,
      },
      emergency: { band: decision.emergency.band, show_hotline: decision.emergency.showHotline, hotlines: decision.emergency.showHotline ? HOTLINES : [] },
      clarification,
      total: services.length,
      cacheable: decision.cacheable,
      versions: { model: signals.modelVersion ?? null, rules: decision.rulesVersion, scorecard: null },
      timing_ms: { classify: signals.ms, total: Date.now() - started },
      prototype: { services: 'synthetic catalog', classifier: signals.needs.status === 'ok' ? 'ml-broker (real)' : 'ml-broker unavailable' },
    },
  };
}
