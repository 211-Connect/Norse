#!/usr/bin/env node
/**
 * Prepares a checkout for a target build of Norse: deletes the route files
 * the target never serves, so `next build` leaves them (and everything only
 * they import) out of the bundle. Used by the Dockerfile's `app` and `cms`
 * targets with `NORSE_BUILD` set to the same value, which drops the
 * remaining in-process Payload code paths (docs/cms-app-separation-plan.md).
 *
 * DESTRUCTIVE: it deletes source files. Run it only in a throwaway copy (a
 * Docker build stage, a CI checkout), never in a working checkout.
 *
 * Usage: node bin/prepare-build-target.mjs <app|cms> --yes
 */
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

/** Paths (from the repository root) each target does not serve. */
const PRUNE = {
  // The public app: no Payload admin, REST, CMS internal API or PDF render.
  app: ['src/app/(payload)', 'src/pages'],
  // The CMS: no public pages and none of the public app's own API routes.
  // It keeps /api/health(z), /api/metrics and /api/keycloak/domain-check.
  cms: [
    'src/app/(app)/[locale]',
    'src/app/(app)/api/auth',
    'src/app/(app)/api/cms-admin-redirect',
    'src/app/(app)/api/resource-titles',
    'src/app/(app)/api/search-config',
    'src/app/(app)/api/share',
    'src/app/(app)/api/webhook',
  ],
};

const [target, confirm] = process.argv.slice(2);

if (!(target in PRUNE)) {
  console.error(
    `Usage: node bin/prepare-build-target.mjs <${Object.keys(PRUNE).join('|')}> --yes`,
  );
  process.exit(1);
}

if (confirm !== '--yes') {
  console.error(
    'Refusing to delete source files without --yes. Run this only in a throwaway copy (Docker build stage, CI).',
  );
  process.exit(1);
}

if (process.env.NORSE_BUILD !== target) {
  console.error(
    `NORSE_BUILD must be "${target}" for this build (got "${process.env.NORSE_BUILD ?? ''}").`,
  );
  process.exit(1);
}

for (const path of PRUNE[target]) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    console.error(`Expected ${path} to exist; the prune list is out of date.`);
    process.exit(1);
  }
  rmSync(absolute, { recursive: true });
  console.log(`[prepare-build-target:${target}] removed ${path}`);
}
