import {
  type Operation,
  type Outcome,
  classifyStatus,
  isTimeoutError,
  recordDependency,
  toOperation,
} from './dependency';
import { injectTraceparent, spanOptionsFor, urlParts } from './fetch';

interface ApiRoute {
  method: string;
  /** Generated client path template; `{name}` segments are IDs. */
  template: string;
  operation: Operation;
}

/**
 * Fixed operation table built from the `path:`/`method:` pairs in
 * `src/lib/api/generated/*.ts` (generated files are never edited). Only the
 * operations the plan recognises are listed; anything else maps to `other`.
 * Static segments are listed before single-segment placeholders so that e.g.
 * `/resource/titles` does not resolve as `/resource/{id}`.
 */
const API_ROUTES: readonly ApiRoute[] = [
  { method: 'GET', template: '/search', operation: 'search_v1' },
  { method: 'POST', template: '/search', operation: 'search_v2' },
  { method: 'GET', template: '/search/predict', operation: 'search_predict' },
  { method: 'GET', template: '/search/re-rank', operation: 'search_rerank' },
  {
    method: 'POST',
    template: '/resource/titles',
    operation: 'resource_titles',
  },
  {
    method: 'GET',
    template: '/resource/original/{id}',
    operation: 'resource_get',
  },
  { method: 'GET', template: '/resource/{id}', operation: 'resource_get' },
  { method: 'GET', template: '/suggestion/term', operation: 'suggestion' },
  { method: 'GET', template: '/suggestion', operation: 'suggestion' },
  { method: 'GET', template: '/taxonomy/term', operation: 'taxonomy' },
  { method: 'GET', template: '/taxonomy', operation: 'taxonomy' },
  { method: 'GET', template: '/geocoding/forward', operation: 'geocoding' },
  { method: 'GET', template: '/geocoding/reverse', operation: 'geocoding' },
  {
    method: 'GET',
    template: '/organization/service-at-location/{salId}',
    operation: 'organization',
  },
  { method: 'GET', template: '/organization/{id}', operation: 'organization' },
  { method: 'GET', template: '/organization', operation: 'organization' },
  { method: 'GET', template: '/service/{id}', operation: 'service' },
  { method: 'GET', template: '/favorite-list/search', operation: 'favorite' },
  { method: 'POST', template: '/favorite-list/sync', operation: 'favorite' },
  {
    method: 'GET',
    template: '/favorite-list/{id}/favorites',
    operation: 'favorite',
  },
  {
    method: 'DELETE',
    template: '/favorite-list/{id}/favorites',
    operation: 'favorite',
  },
  { method: 'GET', template: '/favorite-list/{id}', operation: 'favorite' },
  { method: 'PUT', template: '/favorite-list/{id}', operation: 'favorite' },
  { method: 'DELETE', template: '/favorite-list/{id}', operation: 'favorite' },
  { method: 'POST', template: '/favorite-list', operation: 'favorite' },
  { method: 'GET', template: '/favorite-list', operation: 'favorite' },
  { method: 'POST', template: '/favorite', operation: 'favorite' },
  {
    method: 'DELETE',
    template: '/favorite/{favoriteId}/{favoriteListId}',
    operation: 'favorite',
  },
  {
    method: 'GET',
    template: '/printable-directories/public/{slug}/preview',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template:
      '/printable-directories/{id}/sections/{sectionId}/sources/{sourceId}',
    operation: 'printable_directory',
  },
  {
    method: 'DELETE',
    template:
      '/printable-directories/{id}/sections/{sectionId}/sources/{sourceId}',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template:
      '/printable-directories/{id}/sections/{sectionId}/sources/reorder',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/printable-directories/{id}/sections/{sectionId}/sources',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template: '/printable-directories/{id}/sections/{sectionId}',
    operation: 'printable_directory',
  },
  {
    method: 'DELETE',
    template: '/printable-directories/{id}/sections/{sectionId}',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template: '/printable-directories/{id}/sections/reorder',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/printable-directories/{id}/sections',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/printable-directories/{id}/preview',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/printable-directories/{id}',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template: '/printable-directories/{id}',
    operation: 'printable_directory',
  },
  {
    method: 'DELETE',
    template: '/printable-directories/{id}',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/printable-directories',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/printable-directories',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/analytics/events/batch',
    operation: 'analytics',
  },
  { method: 'POST', template: '/analytics/events', operation: 'analytics' },
  { method: 'GET', template: '/analytics/{endpoint}', operation: 'analytics' },
  {
    method: 'POST',
    template: '/cms-config/cache/clear/{tenantId}',
    operation: 'cms_config',
  },
  {
    method: 'POST',
    template: '/cms-config/cache/clear',
    operation: 'cms_config',
  },
  { method: 'POST', template: '/resource/batch', operation: 'resource_get' },
  { method: 'GET', template: '/short-url/{id}', operation: 'short_url' },
  { method: 'POST', template: '/short-url', operation: 'short_url' },
  {
    method: 'GET',
    template: '/printable-directories/{id}/deliveries',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/printable-directories/{id}/deliveries',
    operation: 'printable_directory',
  },
  {
    method: 'PATCH',
    template: '/printable-directories/{id}/deliveries/{deliveryId}',
    operation: 'printable_directory',
  },
  {
    method: 'DELETE',
    template: '/printable-directories/{id}/deliveries/{deliveryId}',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/internal/printable-directory-deliveries/due',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/internal/printable-directory-deliveries/{deliveryId}/preview',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/internal/printable-directory-deliveries/{deliveryId}/claim',
    operation: 'printable_directory',
  },
  {
    method: 'POST',
    template: '/internal/printable-directory-deliveries/{deliveryId}/result',
    operation: 'printable_directory',
  },
  {
    method: 'GET',
    template: '/taxonomy-scorecard/taxonomies',
    operation: 'taxonomy_scorecard',
  },
  {
    method: 'GET',
    template: '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}',
    operation: 'taxonomy_scorecard',
  },
  {
    method: 'PUT',
    template: '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}',
    operation: 'taxonomy_scorecard',
  },
  {
    method: 'POST',
    template:
      '/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}/enable',
    operation: 'taxonomy_scorecard',
  },
  {
    method: 'GET',
    template: '/tenant-config/{tenantId}',
    operation: 'tenant_config',
  },
  {
    method: 'GET',
    template: '/tenant-config/{tenantId}/topics',
    operation: 'tenant_config',
  },
  {
    method: 'GET',
    template: '/tenant-config/{tenantId}/suggestions',
    operation: 'tenant_config',
  },
  {
    method: 'POST',
    template: '/internal/blocked-traffic',
    operation: 'blocked_traffic',
  },
];

function splitPath(pathname: string): string[] {
  return pathname.split('/').filter((segment) => segment.length > 0);
}

function matchesTemplate(template: string, pathname: string): boolean {
  const expected = splitPath(template);
  const actual = splitPath(pathname);
  if (expected.length !== actual.length) return false;
  return expected.every(
    (segment, index) => segment.startsWith('{') || segment === actual[index],
  );
}

/**
 * Every static segment that appears in `API_ROUTES`; the only literals a
 * fallback template may keep.
 */
const KNOWN_LITERALS: Record<string, true> = {};
for (const route of API_ROUTES) {
  for (const segment of splitPath(route.template)) {
    if (!segment.startsWith('{')) KNOWN_LITERALS[segment] = true;
  }
}

/**
 * Fallback template for a request outside `API_ROUTES`. The raw pathname must
 * never reach a span name: Tempo's span-metrics processor turns every distinct
 * one into a permanent Prometheus series. Segments from `API_ROUTES` are a
 * finite set and stay readable; everything else is unbounded — an id, a short
 * code, a tenant slug or a gateway prefix — and becomes `{other}`, whether or
 * not it looks like a number or a UUID.
 */
function shapePathTemplate(pathname: string): string {
  const segments = splitPath(pathname);
  if (segments.length === 0) return '/';

  return `/${segments
    .map((segment) => (KNOWN_LITERALS[segment] === true ? segment : '{other}'))
    .join('/')}`;
}

/**
 * Resolves a generated-client request to its fixed operation and path
 * template. `template` is what the span name uses, so IDs are stripped.
 */
export function resolveApiRequest(
  method: string,
  pathname: string,
): { operation: Operation; template: string } {
  const upperMethod = method.toUpperCase();

  // The generated clients prepend `API_URL`, which in the cluster is the
  // gateway path prefix (`https://<gateway>/norse-api/v1`). Try the exact
  // pathname first, then successively shorter suffixes, so the fixed
  // operation table stays effective behind that prefix.
  const segments = splitPath(pathname);
  const candidates = [pathname];
  for (let drop = 1; drop < segments.length; drop += 1) {
    candidates.push(`/${segments.slice(drop).join('/')}`);
  }
  const route = candidates
    .map((candidatePath) =>
      API_ROUTES.find(
        (candidate) =>
          candidate.method === upperMethod &&
          matchesTemplate(candidate.template, candidatePath),
      ),
    )
    .find((candidate) => candidate !== undefined);

  return route
    ? { operation: route.operation, template: route.template }
    : {
        operation: toOperation('norse_api', 'other'),
        template: shapePathTemplate(pathname),
      };
}

/**
 * `customFetch` for the generated Norse API clients: records the dependency
 * metric, keeps query strings out of the fetch span, and injects the `-00`
 * traceparent for unsampled requests (plan §1.3 item 2).
 *
 * `clientName` documents which generated client the fetch belongs to; the
 * operation table already identifies the call, so it is not a span attribute
 * (keeps cardinality down).
 */
export function instrumentedApiFetch(_clientName: string): typeof fetch {
  return async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    const { pathname } = urlParts(url);
    const { operation, template } = resolveApiRequest(method, pathname);
    const dependency = 'norse_api' as const;

    const headers = new Headers(init?.headers);
    injectTraceparent(headers, dependency);

    const start = performance.now();
    let outcome: Outcome = 'error';
    try {
      const response = await fetch(url, {
        ...init,
        ...spanOptionsFor(url, method, 'norse_api', template),
        headers,
      });
      outcome = classifyStatus(dependency, operation, response.status);
      return response;
    } catch (error) {
      outcome = isTimeoutError(error) ? 'timeout' : 'error';
      throw error;
    } finally {
      recordDependency(
        dependency,
        operation,
        outcome,
        (performance.now() - start) / 1000,
      );
    }
  };
}
