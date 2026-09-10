/**
 * Per-tenant fixture data for the multi-tenant e2e matrix (MBOA, WA, VA, PA,
 * AZ across dev/prod - see e2e/AGENTS.md "Multi-tenant test matrix").
 *
 * The active tenant is selected at runtime via `E2E_TENANT_KEY` (set per CI
 * matrix job in `.github/workflows/e2e-tests.yaml`, defaults to `MBOA`
 * locally to preserve the historical single-tenant behavior). The active
 * environment is selected via `E2E_TENANT_ENV` (`dev` | `prod`, defaults to
 * `dev`) and only affects flags that genuinely differ by environment for the
 * same tenant (currently: AI search rollout).
 *
 * Values here are real, live taxonomy codes/labels gathered by crawling each
 * tenant's site - NOT mocked or invented. Tests using this fixture assert
 * content presence (`> 0` results, visible elements) and never assert exact
 * counts, since live data changes over time.
 */

export type TenantKey = 'MBOA' | 'WA' | 'VA' | 'PA' | 'AZ' | 'SCC';

export type TenantEnv = 'dev' | 'prod';

/**
 * Real, live free-text queries verified (by hand, against the live AI
 * classification service) to deterministically trigger a specific
 * `AiClassificationScenario` for a given tenant. Used by
 * `search-ai-classification.spec.ts` instead of a single `broadQuery` +
 * branching assertions, since the classifier's scenario for a given query is
 * stable across runs but not guessable from the query text alone.
 *
 * There is intentionally no `lowConfidence` entry - no query reliably
 * triggering `search_and_notify_low_confidence` has been found yet for any
 * enabled tenant. Add one (and a corresponding test) once the team finds one.
 */
export type AiScenarioQueries = {
  /** Triggers the direct `search` scenario - no clarification, no notice banner. */
  direct: string;
  /** Triggers `search_and_notify_low_info` with a non-zero result count. */
  lowInfoWithResults: string;
  /** Triggers a clarification scenario (`clarify_low_info` / `clarify_multiple_labels`). */
  clarify: string;
};

export type TenantFixture = {
  key: TenantKey;
  displayName: string;
  /** A broad free-text query expected to return results for this tenant. */
  broadQuery: string;
  /** A real HSDS taxonomy code + its on-site label, used by taxonomy-search tests. */
  taxonomy: { code: string; label: string };
  /**
   * A real city name within this tenant's actual service area, used to
   * exercise location-dependent search UI (facets, sort-by-distance).
   * Deliberately per-tenant rather than a single shared city (e.g.
   * 'minneapolis') - a location far outside a tenant's service area is not
   * guaranteed to return the same non-zero result counts other
   * location-gated assertions rely on.
   */
  testLocation: string;
  /** Whether AI classification search is enabled, per environment. */
  aiSearchEnabled: Record<TenantEnv, boolean>;
  /** Only set for tenants/environments with AI search enabled - see `AiScenarioQueries`. */
  aiScenarioQueries?: AiScenarioQueries;
  /**
   * Whether this tenant's search results page has a facets/filters panel at
   * all. Some tenants (e.g. VA, AZ) don't configure any facets, so
   * facet/filter-dependent tests must not run for them rather than fail or
   * self-skip on an empty checkbox count.
   */
  hasFacets: boolean;
  /**
   * A real, live resource id (dev environment) known to exist on this
   * tenant, used by `search-resource-direct-link.spec.ts` to verify that
   * navigating straight to `/search/{id}` (no search flow) renders that
   * resource. Optional - omitted for tenants without a verified id yet;
   * the spec skips (not fails) for those, same convention as `hasFacets`.
   */
  directResourceId?: string;
};

export const TENANT_FIXTURES: Record<TenantKey, TenantFixture> = {
  MBOA: {
    key: 'MBOA',
    displayName: 'MN AdResources (MBOA)',
    broadQuery: 'food',
    taxonomy: { code: 'DT-8800', label: 'Tax Help' },
    testLocation: 'Minneapolis',
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: true,
    directResourceId: '98e5490a-8468-5673-afe3-8baffef6a236',
  },
  WA: {
    key: 'WA',
    displayName: 'Washington 211',
    broadQuery: 'health',
    taxonomy: { code: 'LV-1600', label: 'Dental Care' },
    testLocation: 'Seattle',
    aiSearchEnabled: { dev: true, prod: false },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: true,
    directResourceId: '01fc1648-60db-59d0-b5fc-ba5027767fb1',
  },
  VA: {
    key: 'VA',
    displayName: 'Virginia 211',
    broadQuery: 'food',
    taxonomy: {
      code: 'BH-0500',
      label: 'At Risk/Homeless Housing Related Assistance Programs',
    },
    testLocation: 'Richmond',
    aiSearchEnabled: { dev: true, prod: false },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: false,
    directResourceId: 'd87e8f4e-9995-546d-b57a-f38cde595304',
  },
  PA: {
    key: 'PA',
    displayName: 'Pennsylvania 211',
    broadQuery: 'food',
    taxonomy: { code: 'BH-1800.1500-100', label: 'Domestic Violence Shelters' },
    testLocation: 'Philadelphia',
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: true,
    directResourceId: 'aa3e3bb5-b065-5996-9019-e52b75b9a8e8',
  },
  AZ: {
    key: 'AZ',
    displayName: 'Arizona 211',
    broadQuery: 'food',
    taxonomy: { code: 'BH-1800.8500-185', label: 'Extreme Weather Shelters' },
    testLocation: 'Phoenix',
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: false,
    directResourceId: '0470d494-2311-5dd5-b3d7-584371f872af',
  },
  SCC: {
    key: 'SCC',
    displayName: '211 Santa Cruz County',
    broadQuery: 'food',
    taxonomy: { code: 'ND-1500', label: 'Job Assistance Centers' },
    testLocation: 'Santa Cruz',
    aiSearchEnabled: { dev: true, prod: true },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: false,
    directResourceId: '21d6b142-6dde-57dd-bbbf-e65139c6ff99',
  },
};

const DEFAULT_TENANT_KEY: TenantKey = 'MBOA';

export function getCurrentTenantKey(): TenantKey {
  const raw = process.env.E2E_TENANT_KEY?.toUpperCase();
  return raw != null && raw in TENANT_FIXTURES
    ? (raw as TenantKey)
    : DEFAULT_TENANT_KEY;
}

export function getCurrentTenantEnv(): TenantEnv {
  return process.env.E2E_TENANT_ENV?.toLowerCase() === 'prod' ? 'prod' : 'dev';
}

export function getCurrentTenant(): TenantFixture {
  return TENANT_FIXTURES[getCurrentTenantKey()];
}

export function isAiSearchEnabledForCurrentTenant(): boolean {
  const tenant = getCurrentTenant();
  return tenant.aiSearchEnabled[getCurrentTenantEnv()];
}

export function hasFacetsForCurrentTenant(): boolean {
  return getCurrentTenant().hasFacets;
}

export function getDirectResourceIdForCurrentTenant(): string | undefined {
  return getCurrentTenant().directResourceId;
}

/**
 * Returns the current tenant's `aiScenarioQueries`, throwing a clear error if
 * missing rather than letting callers silently skip/branch on `undefined`.
 * Only call this behind an `isAiSearchEnabledForCurrentTenant()` gate.
 */
export function getRequiredAiScenarioQueries(): AiScenarioQueries {
  const tenant = getCurrentTenant();
  if (!tenant.aiScenarioQueries) {
    throw new Error(
      `Tenant "${tenant.key}" has AI search enabled but no aiScenarioQueries fixture - ` +
        'add one to e2e/fixtures/tenants.ts before running search-ai-classification.spec.ts for it.',
    );
  }
  return tenant.aiScenarioQueries;
}
