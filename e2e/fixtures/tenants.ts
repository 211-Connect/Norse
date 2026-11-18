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

export type TenantKey = 'MBOA' | 'WA' | 'VA' | 'PA' | 'AZ' | 'SCC' | 'DUPAGE';

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

/** A place picked in the location field that maps to a Region (docs/area-search.md). */
export type AreaPick = {
  /** Typed into the location field. */
  typed: string;
  /** The exact suggestion to pick. */
  suggestion: string;
  /** Expected `region` in the URL. */
  regionId: string;
  /** Expected name in the map legend ("Search area: …"). */
  legendName: string;
};

/** A place picked in the location field that stays a point + radius search. */
export type PointPick = { typed: string; suggestion: string };

/**
 * Real geocoder suggestions in the tenant's area, one per Region type, for
 * `search-area.spec.ts`. `city` only where the tenant's state has city
 * Regions seeded (WA today); `unseededCity` is a city that has none yet and
 * must fall back to a point search.
 */
export type AreaSearchFixture = {
  state: AreaPick;
  county: AreaPick;
  zip: AreaPick;
  city?: AreaPick;
  unseededCity?: PointPick;
  address: PointPick;
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
  /**
   * Base URL for each environment. Used to derive `E2E_BASE_URL` in CI and
   * local runs unless it is explicitly overridden.
   */
  baseUrl: Record<TenantEnv, string>;
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
  /**
   * Whether organization search (`enableOrganizationSearch`) is enabled,
   * per environment - same shape as `aiSearchEnabled`. Defaults to `false`
   * for every tenant/environment until a tenant actually opts in.
   */
  organizationSearchEnabled: Record<TenantEnv, boolean>;
  /**
   * A real organization id, name (+ optional city, for badge assertions)
   * known to exist on this tenant, and verified NOT to collide with another
   * organization of the exact same name in that tenant - see
   * `docs/search.md`'s "known limitation" note. Required once
   * `organizationSearchEnabled` is true for a tenant/env; omitted until
   * then, same convention as `aiScenarioQueries`.
   */
  organization?: { id: string; name: string; city?: string };
  /**
   * Set only for tenants/environments with "Show all results on the map"
   * (`showAllResultsOnMap`) on, per environment. `resultTotal` is the
   * `#result-total` text an empty search shows, e.g. `1-100 of 10,000+`: the
   * page size and the total (capped at 10,000) with the flag on. The
   * `map-pins` spec skips where it is missing.
   */
  mapPins?: Partial<Record<TenantEnv, { resultTotal: string }>>;
  /** Area search picks; see `AreaSearchFixture`. */
  areaSearch: AreaSearchFixture;
  /**
   * The Payload CMS that serves this tenant, for the `cms` project
   * (`e2e/cms/`). Set on one tenant per CMS deployment: the super-admin tests
   * run in that tenant's cell. Dev only, on purpose: the CMS tests never run
   * on production, where customers would see the test users' activity, so
   * there is no `prod` key.
   */
  cmsBaseUrl?: { dev: string };
};

export const TENANT_FIXTURES: Record<TenantKey, TenantFixture> = {
  MBOA: {
    key: 'MBOA',
    displayName: 'MN AdResources (MBOA)',
    broadQuery: 'food',
    taxonomy: { code: 'DT-8800', label: 'Tax Help' },
    testLocation: 'Minneapolis',
    baseUrl: {
      dev: 'https://stg-mboa.c211.io/adresources',
      prod: 'https://mn.gov/adresources',
    },
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: true,
    directResourceId: '98e5490a-8468-5673-afe3-8baffef6a236',
    organizationSearchEnabled: { dev: false, prod: false },
    areaSearch: {
      state: {
        typed: 'Minnesota',
        suggestion: 'Minnesota, United States',
        regionId: 'state:MN',
        legendName: 'Minnesota',
      },
      county: {
        typed: 'Hennepin County',
        suggestion: 'Hennepin County, Minnesota, United States',
        regionId: 'county:27053',
        legendName: 'Hennepin County, MN',
      },
      zip: {
        typed: '55401',
        suggestion: 'Minneapolis, Minnesota 55401, United States',
        regionId: 'zip:55401',
        legendName: '55401 — Minneapolis, MN',
      },
      unseededCity: {
        typed: 'Saint Paul',
        suggestion: 'Saint Paul, Minnesota, United States',
      },
      address: {
        typed: '350 S 5th St, Minneapolis',
        suggestion:
          '350 South 5th Street, Minneapolis, Minnesota 55415, United States',
      },
    },
  },
  WA: {
    key: 'WA',
    displayName: 'Washington 211',
    broadQuery: 'health',
    taxonomy: { code: 'LV-1600', label: 'Dental Care' },
    testLocation: 'Seattle',
    baseUrl: {
      dev: 'https://dev-wa211.c211.io',
      prod: 'https://search.wa211.org',
    },
    cmsBaseUrl: { dev: 'https://dev-cms.c211.io' },
    aiSearchEnabled: { dev: true, prod: false },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: true,
    directResourceId: '01fc1648-60db-59d0-b5fc-ba5027767fb1',
    organizationSearchEnabled: { dev: false, prod: false },
    mapPins: {
      dev: { resultTotal: '1-25 of 10,000+' },
      prod: { resultTotal: '1-25 of 10,000+' },
    },
    areaSearch: {
      state: {
        typed: 'Washington',
        suggestion: 'Washington, United States',
        regionId: 'state:WA',
        legendName: 'Washington',
      },
      county: {
        typed: 'King County',
        suggestion: 'King County, Washington, United States',
        regionId: 'county:53033',
        legendName: 'King County, WA',
      },
      zip: {
        typed: '98101',
        suggestion: 'Seattle, Washington 98101, United States',
        regionId: 'zip:98101',
        legendName: '98101 — Seattle, WA',
      },
      city: {
        typed: 'Tacoma',
        suggestion: 'Tacoma, Washington, United States',
        regionId: 'place:5370000',
        legendName: 'Tacoma, WA',
      },
      address: {
        typed: '600 4th Ave, Seattle',
        suggestion: '600 4th Avenue, Seattle, Washington 98104, United States',
      },
    },
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
    baseUrl: {
      dev: 'https://dev-va211.c211.io',
      prod: 'https://search.211virginia.org',
    },
    aiSearchEnabled: { dev: true, prod: false },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: false,
    directResourceId: 'd87e8f4e-9995-546d-b57a-f38cde595304',
    organizationSearchEnabled: { dev: false, prod: false },
    areaSearch: {
      state: {
        typed: 'Virginia',
        suggestion: 'Virginia, United States',
        regionId: 'state:VA',
        legendName: 'Virginia',
      },
      county: {
        typed: 'Henrico County',
        suggestion: 'Henrico County, Virginia, United States',
        regionId: 'county:51087',
        legendName: 'Henrico County, VA',
      },
      zip: {
        typed: '23219',
        suggestion: 'Richmond, Virginia 23219, United States',
        regionId: 'zip:23219',
        legendName: '23219 — Richmond, VA',
      },
      address: {
        typed: '900 E Broad St, Richmond',
        suggestion:
          '900 East Broad Street, Richmond, Virginia 23298, United States',
      },
    },
  },
  PA: {
    key: 'PA',
    displayName: 'Pennsylvania 211',
    broadQuery: 'food',
    taxonomy: { code: 'BH-1800.1500-100', label: 'Domestic Violence Shelters' },
    testLocation: 'Philadelphia',
    baseUrl: {
      dev: 'https://dev-pa211.c211.io',
      prod: 'https://search.pa211.org',
    },
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: true,
    directResourceId: 'aa3e3bb5-b065-5996-9019-e52b75b9a8e8',
    organizationSearchEnabled: { dev: false, prod: false },
    areaSearch: {
      state: {
        typed: 'Pennsylvania',
        suggestion: 'Pennsylvania, United States',
        regionId: 'state:PA',
        legendName: 'Pennsylvania',
      },
      county: {
        typed: 'Philadelphia County',
        suggestion: 'Philadelphia County, Pennsylvania, United States',
        regionId: 'county:42101',
        legendName: 'Philadelphia County, PA',
      },
      zip: {
        typed: '19107',
        suggestion: 'Philadelphia, Pennsylvania 19107, United States',
        regionId: 'zip:19107',
        legendName: '19107 — Philadelphia, PA',
      },
      address: {
        typed: '1400 John F Kennedy Blvd, Philadelphia',
        suggestion:
          '1400 John F. Kennedy Boulevard, Philadelphia, Pennsylvania 19107, United States',
      },
    },
  },
  AZ: {
    key: 'AZ',
    displayName: 'Arizona 211',
    broadQuery: 'food',
    taxonomy: { code: 'BH-1800.8500-185', label: 'Extreme Weather Shelters' },
    testLocation: 'Phoenix',
    baseUrl: {
      dev: 'https://dev-az211.c211.io',
      prod: 'https://search.211arizona.org',
    },
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: false,
    directResourceId: '0470d494-2311-5dd5-b3d7-584371f872af',
    organizationSearchEnabled: { dev: false, prod: false },
    areaSearch: {
      state: {
        typed: 'Arizona',
        suggestion: 'Arizona, United States',
        regionId: 'state:AZ',
        legendName: 'Arizona',
      },
      county: {
        typed: 'Maricopa County',
        suggestion: 'Maricopa County, Arizona, United States',
        regionId: 'county:04013',
        legendName: 'Maricopa County, AZ',
      },
      zip: {
        typed: '85004',
        suggestion: 'Phoenix, Arizona 85004, United States',
        regionId: 'zip:85004',
        legendName: '85004 — Phoenix, AZ',
      },
      address: {
        typed: '200 W Washington St, Phoenix',
        suggestion:
          '200 West Washington Street, Phoenix, Arizona 85003, United States',
      },
    },
  },
  SCC: {
    key: 'SCC',
    displayName: '211 Santa Cruz County',
    broadQuery: 'food',
    taxonomy: { code: 'ND-1500', label: 'Job Assistance Centers' },
    testLocation: 'Santa Cruz',
    baseUrl: {
      dev: 'https://dev-scc211.c211.io',
      prod: 'https://search.211santacruzcounty.org',
    },
    aiSearchEnabled: { dev: true, prod: true },
    aiScenarioQueries: {
      direct: "I'm hungry",
      lowInfoWithResults: 'computer',
      clarify: 'shelter or transport or food',
    },
    hasFacets: false,
    directResourceId: '21d6b142-6dde-57dd-bbbf-e65139c6ff99',
    organizationSearchEnabled: { dev: true, prod: true },
    organization: {
      id: 'acc5576b-b1ff-5cd6-ad7f-befff6912601',
      name: 'COMMUNITY BRIDGES',
      city: 'Watsonville',
    },
    areaSearch: {
      state: {
        typed: 'California',
        suggestion: 'California, United States',
        regionId: 'state:CA',
        legendName: 'California',
      },
      county: {
        typed: 'Santa Cruz County',
        suggestion: 'Santa Cruz County, California, United States',
        regionId: 'county:06087',
        legendName: 'Santa Cruz County, CA',
      },
      zip: {
        typed: '95060',
        suggestion: 'Santa Cruz, California 95060, United States',
        regionId: 'zip:95060',
        legendName: '95060 — Santa Cruz, CA',
      },
      address: {
        typed: '701 Ocean St, Santa Cruz',
        suggestion:
          '701 Ocean Street, Santa Cruz, California 95060, United States',
      },
    },
  },
  DUPAGE: {
    key: 'DUPAGE',
    displayName: '211 of DuPage County',
    broadQuery: 'food',
    taxonomy: { code: 'BD-1800.2000', label: 'Food Pantries' },
    testLocation: 'Warrenville',
    baseUrl: {
      dev: 'https://dev-dupage.c211.io',
      prod: 'https://search.211dupage.gov',
    },
    aiSearchEnabled: { dev: false, prod: false },
    hasFacets: false,
    directResourceId: '041a0d9f-d907-5f9d-a7bf-76854c7afbbf',
    organizationSearchEnabled: { dev: true, prod: true },
    organization: {
      id: 'd37a6453-e5b4-56a9-ba6f-22e7e7c7b2f6',
      name: 'Interfaith Food Pantry',
      city: 'Warrenville',
    },
    areaSearch: {
      state: {
        typed: 'Illinois',
        suggestion: 'Illinois, United States',
        regionId: 'state:IL',
        legendName: 'Illinois',
      },
      county: {
        typed: 'DuPage County',
        suggestion: 'DuPage County, Illinois, United States',
        regionId: 'county:17043',
        legendName: 'DuPage County, IL',
      },
      zip: {
        typed: '60187',
        suggestion: 'Wheaton, Illinois 60187, United States',
        regionId: 'zip:60187',
        legendName: '60187 — Wheaton, IL',
      },
      address: {
        typed: '421 N County Farm Rd, Wheaton',
        suggestion:
          '421 North County Farm Road, Wheaton, Illinois 60187, United States',
      },
    },
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

export function getBaseUrlForCurrentTenant(): string {
  const tenant = getCurrentTenant();
  return tenant.baseUrl[getCurrentTenantEnv()];
}

export function getTestEmailForCurrentTenant(): string {
  const tenant = getCurrentTenant();
  const env = getCurrentTenantEnv();
  return `test-${tenant.key.toLowerCase()}-${env}@c211.io`;
}

/**
 * The dev CMS base URL for the current tenant, or `undefined` when the
 * tenant has none or the environment is not `dev` (CMS tests never run on
 * production).
 */
export function getCmsBaseUrlForCurrentTenant(): string | undefined {
  if (getCurrentTenantEnv() !== 'dev') return undefined;
  return getCurrentTenant().cmsBaseUrl?.dev;
}

/**
 * The CMS test accounts on the current tenant's CMS (dev only): a
 * super-admin, and a tenant-admin on the current tenant.
 */
export function getCmsTestEmailsForCurrentTenant(): {
  superAdmin: string;
  tenantAdmin: string;
} {
  const env = getCurrentTenantEnv();
  return {
    superAdmin: `test-cms-admin-${env}@c211.io`,
    tenantAdmin: `test-cms-${getCurrentTenant().key.toLowerCase()}-${env}@c211.io`,
  };
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

export function getRequiredOrganizationFixture(): {
  id: string;
  name: string;
  city?: string;
} {
  const tenant = getCurrentTenant();
  if (!tenant.organization) {
    throw new Error(
      `Tenant "${tenant.key}" has organization search enabled but no organization fixture - ` +
        'add one to e2e/fixtures/tenants.ts before running search-organization.spec.ts for it.',
    );
  }
  return tenant.organization;
}

/** The map-pins fixture for the current tenant and environment, if the flag is on there. */
export function getMapPinsFixtureForCurrentTenant():
  { resultTotal: string } | undefined {
  return getCurrentTenant().mapPins?.[getCurrentTenantEnv()];
}

export function isOrganizationSearchEnabledForCurrentTenant(): boolean {
  const tenant = getCurrentTenant();
  return tenant.organizationSearchEnabled[getCurrentTenantEnv()];
}
