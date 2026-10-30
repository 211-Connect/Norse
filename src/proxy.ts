import { i18nRouter } from 'next-i18n-router';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { withOptionalCustomBasePath } from './app/(app)/shared/lib/utils';
import { parseHost } from './app/(app)/shared/utils/parseHost';
import { shouldBlockCrawlers } from './app/(app)/shared/utils/shouldBlockCrawlers';
import {
  getPublicPageCategory,
  isShareLinkPath,
} from './app/(app)/shared/utils/publicPageCategory';
import { describeError, truncateBody } from './lib/describe-error';
import { getNorseRole, servesPath } from './lib/norse-role';
import { maskSecret, redactUrl } from './lib/redact';
import type { TenantBasicConfigResponse } from './types/tenantBasicConfig';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';
import { ONE_DAY, ONE_HOUR, ONE_MINUTE } from './utilities/withCache';

const DOMAINS_WITH_CSP = ['localhost', 'therc.vdh.virginia.gov'];

/**
 * Minimal structured-JSON logger for Edge Runtime where pino cannot be used.
 * Emits the same top-level fields as the production pino output so log
 * aggregators (Loki / OpenSearch) can parse both sources uniformly.
 */
const EDGE_LEVELS: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};
const _isDev = process.env.NODE_ENV === 'development';
const _configuredLevel =
  EDGE_LEVELS[
    process.env.NEXT_PUBLIC_LOG_LEVEL ?? (_isDev ? 'debug' : 'info')
  ] ?? EDGE_LEVELS.info;

function edgeLog(
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
  event: string,
  data?: Record<string, unknown>,
) {
  if (EDGE_LEVELS[level] < _configuredLevel) return;

  const entry = JSON.stringify({
    level,
    module: 'middleware',
    event,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...data,
  });
  if (level === 'error' || level === 'fatal') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else if (level === 'debug' || level === 'trace') console.debug(entry);
  else console.log(entry);
}

const TENANT_DATA_CACHE_TTL_MS = 10 * 60 * 1000;
/**
 * A failed lookup (timeout, network error, non-2xx) is cached only briefly:
 * long enough that an outage doesn't make every request wait out the fetch
 * timeout, short enough that a blip doesn't serve a tenant without its
 * config (default locales, no login wall) for the full TTL above.
 */
const TENANT_DATA_FAILURE_CACHE_TTL_MS = 10 * 1000;
const TENANT_DATA_CACHE_MAX_ENTRIES = 1_000;

type TenantDataCacheEntry = {
  data: TenantBasicConfigResponse | null;
  expiresAt: number;
};

const tenantDataCache = new Map<string, TenantDataCacheEntry>();

function getOriginFromUrl(url?: string): string | undefined {
  if (!url) return undefined;

  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function getCachedTenantData(
  host: string,
): TenantBasicConfigResponse | null | undefined {
  const entry = tenantDataCache.get(host);

  if (!entry) {
    return undefined;
  }

  const expired = Date.now() > entry.expiresAt;
  if (expired) {
    tenantDataCache.delete(host);
    return undefined;
  }

  return entry.data;
}

function setCachedTenantData(
  host: string,
  data: TenantBasicConfigResponse | null,
  ttlMs: number = TENANT_DATA_CACHE_TTL_MS,
): void {
  if (tenantDataCache.size >= TENANT_DATA_CACHE_MAX_ENTRIES) {
    const firstKey = tenantDataCache.keys().next().value;
    if (firstKey) {
      tenantDataCache.delete(firstKey);
    }
  }

  tenantDataCache.set(host, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!admin|api/auth|chrome.devtools|api|_next/static|_next/image|images|fonts|favicon.ico|robots.txt|sitemap.xml).*)',
    { source: '/' },
  ],
};

const CDN_CACHE_POLICIES = {
  legal: {
    pattern: /\/legal\//,
    cacheControl: `public, max-age=${ONE_HOUR}, s-maxage=${ONE_DAY}, stale-while-revalidate=${12 * ONE_HOUR}`,
    shared: true,
  },
  home: {
    pattern: /^\/[a-z]{2}(\/)?$/,
    cacheControl: `public, max-age=${10 * ONE_MINUTE}, s-maxage=${30 * ONE_MINUTE}, stale-while-revalidate=${10 * ONE_MINUTE}`,
    shared: true,
  },
  topics: {
    pattern: /\/topics(\/)?$/,
    cacheControl: `public, max-age=${30 * ONE_MINUTE}, s-maxage=${ONE_HOUR}, stale-while-revalidate=${30 * ONE_MINUTE}`,
    shared: true,
  },
  resourceDetail: {
    pattern: /\/search\/[^/?]+$/,
    cacheControl: `private, max-age=${30 * ONE_MINUTE}, stale-while-revalidate=${10 * ONE_MINUTE}`,
    shared: false,
  },
  detailsOriginal: {
    pattern: /\/details\/original/,
    cacheControl: `private, max-age=${30 * ONE_MINUTE}, stale-while-revalidate=${10 * ONE_MINUTE}`,
    shared: false,
  },
} as const;

function cacheControlMiddleware(response: NextResponse, pathname: string) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    response.headers.set('Cache-Control', 'no-cache');
    return;
  }

  for (const [_name, policy] of Object.entries(CDN_CACHE_POLICIES)) {
    if (policy.pattern.test(pathname)) {
      response.headers.set('Cache-Control', policy.cacheControl);
      if (policy.shared) {
        response.headers.set('Vary', 'Cookie');
      }
      return;
    }
  }

  response.headers.set('Cache-Control', 'no-cache');
}

function robotsMiddleware(
  response: NextResponse,
  pathname: string,
  tenantConfig: TenantBasicConfigResponse | null | undefined,
) {
  // Per-tenant de-indexing: when this branded domain opts out of search
  // engines (or the global env gate blocks indexing), mark every page noindex.
  if (shouldBlockCrawlers(tenantConfig?.seo?.noindex ?? false)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return;
  }

  // Otherwise, still disallow indexing for specific sensitive paths.
  const disallowIndexPaths = ['/details/original'];

  const isProduction = process.env.NODE_ENV === 'production';
  if (
    isProduction &&
    disallowIndexPaths.some((path) => pathname.includes(path))
  ) {
    response.headers.set('X-Robots-Tag', 'noindex');
  }
}

function getApiRoute(request: NextRequest, target: string) {
  const host =
    process.env.NODE_ENV !== 'development'
      ? request.headers.get('host')
      : 'localhost:3000';

  const hostname = host?.split(':')[0] || '';
  const isInternal = hostname === 'localhost' || hostname === '127.0.0.1';
  const proto = isInternal
    ? 'http'
    : request.headers.get('x-forwarded-proto') || 'http';

  return withOptionalCustomBasePath(`${proto}://${host}/api/${target}`);
}

/**
 * URL of a Payload CMS API route. `PAYLOAD_CMS_URL` (origin plus any base
 * path, e.g. `https://cms.example.org`) points at the CMS directly, so the
 * request does not go out through Cloudflare on the tenant's public host,
 * whose WAF can answer 403 to a server-side fetch. Without it, the tenant
 * host is used.
 */
function getCmsApiRoute(request: NextRequest, target: string): string {
  const cmsUrl = process.env.PAYLOAD_CMS_URL?.replace(/\/+$/, '');
  return cmsUrl ? `${cmsUrl}/api/${target}` : getApiRoute(request, target);
}

class TenantConfigFetchError extends Error {
  constructor(
    message: string,
    public details: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'TenantConfigFetchError';
  }
}

/**
 * Who answered a failed lookup: a Cloudflare block carries `cf-ray` /
 * `cf-mitigated` and an HTML body, a Norse response a short text body.
 */
async function describeFailedResponse(
  response: Response,
): Promise<Record<string, unknown>> {
  let body: string | undefined;
  try {
    body = truncateBody(await response.text());
  } catch {
    body = undefined;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    fetchUrl: redactUrl(response.url),
    server: response.headers.get('server'),
    cfRay: response.headers.get('cf-ray'),
    cfMitigated: response.headers.get('cf-mitigated'),
    contentType: response.headers.get('content-type'),
    body,
  };
}

function generateNonce() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  return nonce;
}

function isAuthPath(pathname: string): boolean {
  return /\/auth(\/|$)/.test(pathname);
}

async function hasActiveSession(request: NextRequest): Promise<boolean> {
  const sessionRoute = getApiRoute(request, 'auth/session');

  try {
    const response = await fetch(sessionRoute, {
      headers: {
        cookie: request.headers.get('cookie') || '',
        host: request.headers.get('host') || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const session = await response.json();
    return Boolean(session?.user);
  } catch {
    return false;
  }
}

/** Read once: an invalid `NORSE_ROLE` fails the server at startup. */
const NORSE_ROLE = getNorseRole();

/**
 * Pages the role does not serve. The matcher skips `/admin` and `/api`, so
 * only pages reach this: in the CMS (`NORSE_ROLE=cms`) every public page is
 * a 404 and `/` goes to the admin. `/admin` and Payload's REST API are not
 * gated here: matching `/api` would make Next.js buffer every API request
 * body for the proxy (10 MB limit), which breaks large media uploads.
 */
function roleGate(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl;
  if (servesPath(NORSE_ROLE, pathname)) return undefined;

  if (NORSE_ROLE === 'cms' && pathname === '/') {
    return NextResponse.redirect(
      new URL(withOptionalCustomBasePath('/admin'), request.url),
    );
  }

  return new NextResponse('Not Found', { status: 404 });
}

export async function proxy(request: NextRequest) {
  const gated = roleGate(request);
  if (gated) return gated;

  if (request.method === 'POST' && request.url.includes('/[locale]')) {
    edgeLog('warn', 'potentially_malicious_request_blocked', {
      url: request.url,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      xForwardedFor: request.headers.get('x-forwarded-for'),
    });
    return new Response('Aborted by middleware', { status: 403 });
  }

  const nonce = generateNonce();

  // Validate Origin header to prevent malicious payloads (e.g., JNDI injection attempts)
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    const validOrigin = getOriginFromUrl(originHeader);
    if (!validOrigin) {
      edgeLog('warn', 'invalid_origin_header_blocked', {
        origin: originHeader,
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
      });
      // Return 400 Bad Request for invalid Origin header
      return new NextResponse('Invalid Origin header', { status: 400 });
    }
  }

  // Use raw host for headers that require it, but parsed host for logic/identification
  const rawHost = request.headers.get('host') || '';
  const host = parseHost(rawHost);

  let locales = ['en'];
  let defaultLocale = 'en';

  const cached = getCachedTenantData(host);
  let tenantConfig: TenantBasicConfigResponse | null | undefined;

  if (cached !== undefined) {
    // Cache hit (null after a recent failed lookup)
    if (cached && cached.enabledLocales.length && cached.defaultLocale) {
      locales = cached.enabledLocales;
      defaultLocale = cached.defaultLocale;
      tenantConfig = cached;
    }
  } else {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${getCmsApiRoute(request, 'getTenantBasicConfig')}?host=${encodeURIComponent(host)}`,
        {
          // No `host` override: the tenant goes in `?host=`, and the URL's
          // own host must route the request to the CMS.
          headers: {
            'x-internal-api-key': process.env.PAYLOAD_API_ROUTE_SECRET ?? '',
          },
          signal: controller.signal,
          cache: 'no-store',
        },
      );

      if (!response.ok) {
        throw new TenantConfigFetchError(
          `HTTP ${response.status} ${response.statusText}`,
          await describeFailedResponse(response),
        );
      }

      const tenantBasicConfig: TenantBasicConfigResponse =
        await response.json();

      setCachedTenantData(host, tenantBasicConfig);
      tenantConfig = tenantBasicConfig;

      if (
        tenantBasicConfig &&
        tenantBasicConfig.enabledLocales.length &&
        tenantBasicConfig.defaultLocale
      ) {
        locales = tenantBasicConfig.enabledLocales;
        defaultLocale = tenantBasicConfig.defaultLocale;
      } else {
        edgeLog('warn', 'tenant_basic_config_not_configured', {
          tenantBasicConfig,
          url: request.url,
          method: request.method,
          host,
          rawHost,
          userAgent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          xForwardedFor: request.headers.get('x-forwarded-for'),
        });
      }
    } catch (error) {
      // Cache the failure briefly so we don't retry on every request
      setCachedTenantData(host, null, TENANT_DATA_FAILURE_CACHE_TTL_MS);
      edgeLog('error', 'tenant_basic_config_fetch_failed', {
        ...(error instanceof TenantConfigFetchError
          ? { error: error.message, ...error.details }
          : describeError(error)),
        timedOut: error instanceof Error && error.name === 'AbortError',
        secret: maskSecret(process.env.PAYLOAD_API_ROUTE_SECRET),
        url: request.url,
        method: request.method,
        host,
        rawHost,
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        xForwardedFor: request.headers.get('x-forwarded-for'),
      });
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  if (!locales.includes(defaultLocale)) {
    locales.push(defaultLocale);
  }

  const rdwrIp = request.headers.get('x-rdwr-ip');
  if (rdwrIp) {
    const existingXff = request.headers.get('x-forwarded-for');
    request.headers.set(
      'x-forwarded-for',
      existingXff ? `${rdwrIp}, ${existingXff}` : rdwrIp,
    );
    edgeLog('debug', 'rdwr_ip_xff_rewritten', {
      rdwrIp,
      host,
    });
  }

  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (
    tenantConfig?.auth?.requiresLogin &&
    !isAuthPath(pathname) &&
    !isShareLinkPath(pathname)
  ) {
    const publicPageCategory = getPublicPageCategory(pathname);
    const isPublicPage = Boolean(
      publicPageCategory &&
      tenantConfig.auth.publicPages?.includes(publicPageCategory),
    );

    if (!isPublicPage) {
      const authenticated = await hasActiveSession(request);

      if (!authenticated) {
        const signInPath = withOptionalCustomBasePath('/auth/signin');
        const signInUrl = new URL(signInPath, request.url);
        const redirectTarget = withOptionalCustomBasePath(
          `${request.nextUrl.pathname}${request.nextUrl.search}`,
        );
        signInUrl.searchParams.set('redirect', redirectTarget || '/');

        edgeLog('debug', 'tenant_loginwall_redirect', {
          host,
          path: pathname,
          signInPath: signInUrl.pathname,
        });

        return NextResponse.redirect(signInUrl);
      }
    }
  }

  const searchCorrectionResponse = searchLinkCorrectionMiddleware(request);
  if (searchCorrectionResponse) {
    return searchCorrectionResponse;
  }

  // Session ID handling
  let sessionId: string | undefined;
  if (request.cookies.has(SESSION_ID)) {
    sessionId = request.cookies.get(SESSION_ID)?.value;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID().replaceAll('-', '');
  }

  const i18nConfig = {
    defaultLocale,
    locales,
  };
  let response = i18nRouter(request, {
    ...i18nConfig,
    basePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || undefined,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    },
  });
  if (!request.cookies.has(SESSION_ID)) {
    response.cookies.set({
      name: SESSION_ID,
      value: sessionId,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    });
  }

  const isProduction = process.env.NODE_ENV === 'production';

  const umamiScriptOrigin = getOriginFromUrl(
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  );

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com ${umamiScriptOrigin ?? ''} ${isProduction ? "'strict-dynamic'" : "'unsafe-eval' 'unsafe-inline'"};
    style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com;
    img-src 'self' blob: data: https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com https://cdn.c211.io *.digitaloceanspaces.com *.feathr.co www.googletagmanager.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' data: https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com *.digitaloceanspaces.com *.feathr.co https://*.google-analytics.com https://cdn.matomo.cloud https://api.c211.io https://maps.c211.io www.googletagmanager.com www.google.com ${umamiScriptOrigin ?? ''} ${isProduction ? '' : 'http://localhost:* ws://localhost:*'};
    worker-src 'self' blob:;
    child-src 'self' blob:;
    frame-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'self';
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (DOMAINS_WITH_CSP.includes(host)) {
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);
  }
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  cacheControlMiddleware(response, pathname);
  robotsMiddleware(response, pathname, tenantConfig);

  return response;
}
