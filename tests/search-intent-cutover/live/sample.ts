// Cut-over scaffolding (ISS-2372): deleted by ISS-2377.
//
// Which corpus URLs the live runner visits on each tenant. Live visits cost classifier calls on AI tenants,
// so the sample is capped (ISS-2372 suggests 50 per tenant) and spread across every generation the tenant's
// traffic has, most-viewed first, so a small sample still covers each URL shape.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { TENANT_FIXTURES, type TenantKey } from '../../../e2e/fixtures/tenants';

export type CorpusRow = {
  scenario: string;
  tenant: string;
  path: string;
  query: string;
  generation: string;
  views_in_scenario: number;
};

export const TENANTS = Object.keys(TENANT_FIXTURES) as TenantKey[];

export function loadCorpusRows(): CorpusRow[] {
  const dir = join(import.meta.dirname, '../corpus');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .sort()
    .flatMap((f) =>
      readFileSync(join(dir, f), 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as CorpusRow),
    );
}

/**
 * Up to `cap` of a tenant's corpus URLs: one generation at a time in turn, each generation's most-viewed
 * first, until the cap or the tenant's URLs run out. Deterministic for the same corpus.
 */
export function sampleForTenant(
  rows: CorpusRow[],
  tenant: TenantKey,
  cap: number,
): CorpusRow[] {
  const byGeneration = new Map<string, CorpusRow[]>();
  for (const row of rows) {
    if (row.tenant.split('-')[0] !== tenant) continue;
    const list = byGeneration.get(row.generation) ?? [];
    list.push(row);
    byGeneration.set(row.generation, list);
  }
  const queues = [...byGeneration.keys()]
    .sort()
    .map((g) =>
      byGeneration
        .get(g)!
        .sort(
          (a, b) =>
            b.views_in_scenario - a.views_in_scenario ||
            a.scenario.localeCompare(b.scenario),
        ),
    );
  const sample: CorpusRow[] = [];
  while (sample.length < cap && queues.some((q) => q.length)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next && sample.length < cap) sample.push(next);
    }
  }
  return sample;
}

/** The live URL for a corpus row: the tenant's origin plus the path and query as harvested. */
export function liveUrl(base: string, row: CorpusRow): string {
  const origin = new URL(base).origin;
  return `${origin}${row.path}${row.query ? `?${row.query}` : ''}`;
}
