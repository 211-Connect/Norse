/**
 * Which half of Norse this process serves. One image is deployed twice: the
 * public directory (`app`) and Payload CMS (`cms`). `all` is the single
 * process both halves ran in before the split, and stays the default for
 * local dev and e2e. See docs/cms-app-separation-plan.md.
 *
 * No Node-only imports: read by the proxy.
 */
export type NorseRole = 'app' | 'cms' | 'all';

const ROLES: readonly NorseRole[] = ['app', 'cms', 'all'];

function parseRole(name: string, value: string): NorseRole {
  if ((ROLES as readonly string[]).includes(value)) return value as NorseRole;
  throw new Error(`${name} must be one of ${ROLES.join(', ')}; got "${value}"`);
}

/**
 * The role this process runs as.
 *
 * - A target build (`NORSE_BUILD=app|cms`, inlined by Next.js at build
 *   time) is that role; a different `NORSE_ROLE` is a deployment mistake
 *   and throws.
 * - Otherwise (`NORSE_BUILD` unset or `all`): `NORSE_ROLE`, default `all`.
 */
export function getNorseRole(
  value = process.env.NORSE_ROLE,
  build = process.env.NORSE_BUILD,
): NorseRole {
  const role = value ? parseRole('NORSE_ROLE', value) : 'all';
  if (!build || build === 'all') return role;

  const buildRole = parseRole('NORSE_BUILD', build);
  if (value && role !== buildRole) {
    throw new Error(
      `This image is built for NORSE_BUILD=${buildRole}; NORSE_ROLE=${value} does not match`,
    );
  }
  return buildRole;
}

/** Whether this process runs Payload: jobs, migrations, the admin. */
export function runsPayload(role: NorseRole = getNorseRole()): boolean {
  return role !== 'app';
}

/** `/api` routes both apps serve. */
const SHARED_API_PREFIXES = [
  '/api/health',
  '/api/healthz',
  '/api/metrics',
  // Called by Keycloak on either host until it moves to the CMS (plan row 6).
  '/api/keycloak/domain-check',
];

/** `/api` routes of the public app; every other `/api` route is the CMS's. */
const APP_API_PREFIXES = [
  '/api/auth',
  '/api/share',
  '/api/resource-titles',
  '/api/search-config',
  '/api/webhook',
];

function matchesPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

/**
 * Whether `role` serves `pathname` (without the base path). The proxy
 * answers 404 when it does not.
 *
 * - `app`: public pages and its own `/api` routes; not `/admin`, Payload's
 *   REST API or the CMS internal API.
 * - `cms`: `/admin` and every `/api` route that is not the public app's
 *   (Payload REST, `/api/internal/*`, `/api/getTenantBasicConfig`,
 *   `/api/tenants/*`); no public pages.
 */
export function servesPath(role: NorseRole, pathname: string): boolean {
  if (role === 'all') return true;
  if (matchesPrefix(pathname, SHARED_API_PREFIXES)) return true;

  const isCmsPath =
    isAdminPath(pathname) ||
    (isApiPath(pathname) && !matchesPrefix(pathname, APP_API_PREFIXES));

  return role === 'cms' ? isCmsPath : !isCmsPath;
}
