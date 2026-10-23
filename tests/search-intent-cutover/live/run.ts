// Cut-over scaffolding (ISS-2372): deleted by ISS-2377.
//
// The live runner. Visits LIVE TENANT SITES: run it only with sign-off (see README.md).
//
//   baseline  record each tenant's sample on one environment, dated:
//     node --import tsx tests/search-intent-cutover/live/run.ts baseline --env prod [--tenants WA,AZ] [--cap 50]
//   diff      visit each sampled URL on A (a tenant environment) then B (a preview build), back to back:
//     node --import tsx tests/search-intent-cutover/live/run.ts diff --env prod --b WA=https://preview.example
//   A can be another build instead of the environment (two local builds, say):
//     … diff --a WA=http://search.wa211.org.localhost:3000 --b WA=http://search.wa211.org.localhost:3001
//
// Exit codes: 0 every URL passed (data drift allowed); 1 a behaviour change; 2 something could not be
// verified (and nothing changed behaviour). A baseline exits 2 when any visit could not be verified.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import {
  TENANT_FIXTURES,
  type TenantEnv,
  type TenantKey,
} from '../../../e2e/fixtures/tenants';
import {
  compareVisits,
  exitCodeFor,
  type Verdict,
  type Visit,
} from './compare';
import { launchBrowser, observe, RUNNER_USER_AGENT } from './observe';
import { liveUrl, loadCorpusRows, sampleForTenant, TENANTS } from './sample';

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    env: { type: 'string', default: 'prod' },
    tenants: { type: 'string' },
    cap: { type: 'string', default: '50' },
    a: { type: 'string', multiple: true },
    b: { type: 'string', multiple: true },
    out: { type: 'string', default: join(import.meta.dirname, 'runs') },
    'delay-ms': { type: 'string', default: '1000' },
    'timeout-ms': { type: 'string', default: '45000' },
  },
});

const mode = positionals[0];
const env = values.env as TenantEnv;
const cap = Number(values.cap);
const delayMs = Number(values['delay-ms']);
const timeoutMs = Number(values['timeout-ms']);
const date = new Date().toISOString().slice(0, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

if (!['baseline', 'diff'].includes(mode) || !['dev', 'prod'].includes(env)) {
  console.error(
    'usage: run.ts baseline|diff --env dev|prod [...]; see the header',
  );
  process.exit(2);
}

const targets = (pairs: string[] = []) =>
  new Map(
    pairs.map((pair) => {
      const [tenant, base] = pair.split('=');
      return [tenant as TenantKey, base] as const;
    }),
  );
const previews = targets(values.b);
const overridesA = targets(values.a);
const tenants: TenantKey[] =
  mode === 'diff'
    ? [...previews.keys()]
    : values.tenants
      ? (values.tenants.split(',') as TenantKey[])
      : TENANTS;
if (tenants.length === 0 || tenants.some((t) => !TENANT_FIXTURES[t])) {
  console.error(`unknown or missing tenants: ${tenants.join(',') || '(none)'}`);
  process.exit(2);
}

const rows = loadCorpusRows();
const dir = join(values.out!, `${date}-${mode}-${env}`);
mkdirSync(dir, { recursive: true });
const browser = await launchBrowser();
const summary: Record<string, Record<string, number>> = {};
const verdicts: Verdict[] = [];
let unverifiedVisits = 0;

try {
  for (const tenant of tenants) {
    const sample = sampleForTenant(rows, tenant, cap);
    const base = overridesA.get(tenant) ?? TENANT_FIXTURES[tenant].baseUrl[env];
    const lines: string[] = [];
    const counts: Record<string, number> = { sampled: sample.length };
    for (const row of sample) {
      const urlA = liveUrl(base, row);
      const a: Visit = await observe(browser, urlA, { timeoutMs });
      if (mode === 'baseline') {
        if (!a.ok) unverifiedVisits++;
        counts[a.ok ? 'loaded' : 'could_not_verify'] =
          (counts[a.ok ? 'loaded' : 'could_not_verify'] ?? 0) + 1;
        lines.push(
          JSON.stringify({
            scenario: row.scenario,
            generation: row.generation,
            url: urlA,
            visit: a,
          }),
        );
      } else {
        const urlB = liveUrl(previews.get(tenant)!, row);
        const b: Visit = await observe(browser, urlB, { timeoutMs });
        const verdict = compareVisits(a, b);
        verdicts.push(verdict);
        counts[verdict.kind] = (counts[verdict.kind] ?? 0) + 1;
        lines.push(
          JSON.stringify({
            scenario: row.scenario,
            generation: row.generation,
            a: urlA,
            b: urlB,
            verdict,
            visitA: a,
            visitB: b,
          }),
        );
      }
      await sleep(delayMs);
    }
    writeFileSync(join(dir, `${tenant}.jsonl`), lines.join('\n') + '\n');
    summary[tenant] = counts;
    console.log(tenant, JSON.stringify(counts));
  }
} finally {
  await browser.close();
}

writeFileSync(
  join(dir, 'manifest.json'),
  JSON.stringify(
    {
      date,
      mode,
      env,
      cap,
      userAgent: RUNNER_USER_AGENT,
      a: Object.fromEntries(overridesA),
      previews: Object.fromEntries(previews),
      summary,
    },
    null,
    2,
  ) + '\n',
);
console.log(`written to ${dir}`);
process.exit(
  mode === 'diff' ? exitCodeFor(verdicts) : unverifiedVisits ? 2 : 0,
);
