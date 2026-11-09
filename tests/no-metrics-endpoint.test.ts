import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

// Guardrail: Prometheus cannot scrape this app (DigitalOcean App Platform), so
// /api/metrics and prom-client were removed. Keep them out: all telemetry is
// pushed over OTLP. See plans/02-norse.md N6.
const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const srcRoot = path.join(repoRoot, 'src');

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) ? [full] : [];
  });
}

test('no source file references prom-client or the removed metrics token', () => {
  for (const file of walk(srcRoot)) {
    const contents = readFileSync(file, 'utf8');
    for (const term of ['prom-client', 'PROMETHEUS_TOKEN']) {
      assert.ok(
        !contents.includes(term),
        `${path.relative(repoRoot, file)} must not reference ${term}`,
      );
    }
  }
});

test('the unscraped /api/metrics route does not exist', () => {
  const route = path.join(
    srcRoot,
    'app',
    '(app)',
    'api',
    'metrics',
    'route.ts',
  );
  assert.equal(existsSync(route), false, `${route} must not exist`);
});

test('prom-client is not a direct dependency', () => {
  const pkg = JSON.parse(
    readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
  );
  for (const field of ['dependencies', 'devDependencies']) {
    assert.equal(
      Object.hasOwn(pkg[field] ?? {}, 'prom-client'),
      false,
      `prom-client must not be in ${field}`,
    );
  }
});
