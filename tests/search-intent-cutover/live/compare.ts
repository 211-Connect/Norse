// Cut-over scaffolding (ISS-2372): deleted by ISS-2377.
//
// Sorts one URL's two live visits (the same URL on two targets, back to back) into a verdict. What the
// visitor is sent to and shown (status, redirects, final URL, title, clarify dialog, alert) is behaviour; the
// results themselves change with the data, so they are reported as drift but do not fail. A visit that could
// not load is never a pass.

export type Hop = { url: string; status: number };

export type Observation = {
  /** The navigation's redirects, in order, then the final response. URLs relative to the target's origin. */
  chain: Hop[];
  finalUrl: string;
  title: string;
  resultTotal: string | null;
  resultIds: string[];
  clarify: { open: boolean; options: string[] };
  alert: string | null;
  /** Cross-origin hosts the runner refused to contact (trackers, maps, fonts). */
  blockedHosts: string[];
};

export type Visit =
  { ok: true; observation: Observation } | { ok: false; reason: string };

export type Verdict =
  | { kind: 'pass' }
  | { kind: 'behaviour'; fields: string[] }
  | { kind: 'data'; fields: string[] }
  | { kind: 'could_not_verify'; reason: string };

const BEHAVIOUR: Array<keyof Observation> = [
  'chain',
  'finalUrl',
  'title',
  'clarify',
  'alert',
];
const DATA: Array<keyof Observation> = ['resultTotal', 'resultIds'];

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function compareVisits(a: Visit, b: Visit): Verdict {
  if (!a.ok || !b.ok) {
    const reasons = [a, b].flatMap((v, i) =>
      v.ok ? [] : [`${i === 0 ? 'A' : 'B'}: ${v.reason}`],
    );
    return { kind: 'could_not_verify', reason: reasons.join('; ') };
  }
  const differ = (fields: Array<keyof Observation>) =>
    fields.filter((f) => !same(a.observation[f], b.observation[f]));
  const behaviour = differ(BEHAVIOUR);
  if (behaviour.length) return { kind: 'behaviour', fields: behaviour };
  const data = differ(DATA);
  if (data.length) return { kind: 'data', fields: data };
  return { kind: 'pass' };
}

/** 1 when anything changed behaviour, else 2 when anything could not be verified, else 0. */
export function exitCodeFor(verdicts: Verdict[]): number {
  if (verdicts.length === 0) return 2;
  if (verdicts.some((v) => v.kind === 'behaviour')) return 1;
  if (verdicts.some((v) => v.kind === 'could_not_verify')) return 2;
  return 0;
}
