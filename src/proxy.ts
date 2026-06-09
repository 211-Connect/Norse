import { i18nRouter } from 'next-i18n-router';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { fetchWrapper } from './app/(app)/shared/lib/fetchWrapper';
import { withOptionalCustomBasePath } from './app/(app)/shared/lib/utils';
import { parseHost } from './app/(app)/shared/utils/parseHost';
import { TenantBasicConfigResponse } from './app/(payload)/api/getTenantBasicConfig/route';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';

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
): void {
  if (tenantDataCache.size >= TENANT_DATA_CACHE_MAX_ENTRIES) {
    const firstKey = tenantDataCache.keys().next().value;
    if (firstKey) {
      tenantDataCache.delete(firstKey);
    }
  }

  tenantDataCache.set(host, {
    data,
    expiresAt: Date.now() + TENANT_DATA_CACHE_TTL_MS,
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
    '/((?!admin|api/auth|chrome.devtools|api|_next/static|_next/image|images|favicon.ico|robots.txt|sitemap.xml).*)',
    { source: '/' },
  ],
};

const MINUTE = 60;
const HOUR = 3600;

const CDN_CACHE_POLICIES = {
  legal: {
    pattern: /\/legal\//,
    cacheControl: `public, max-age=${1 * HOUR}, s-maxage=${24 * HOUR}, stale-while-revalidate=${12 * HOUR}`,
  },
  home: {
    pattern: /^\/[a-z]{2}(\/)?$/,
    cacheControl: `public, max-age=${10 * MINUTE}, s-maxage=${30 * MINUTE}, stale-while-revalidate=${10 * MINUTE}`,
  },
  topics: {
    pattern: /\/topics(\/)?$/,
    cacheControl: `public, max-age=${30 * MINUTE}, s-maxage=${1 * HOUR}, stale-while-revalidate=${30 * MINUTE}`,
  },
  resourceDetail: {
    pattern: /\/search\/[^/?]+$/,
    cacheControl: `public, max-age=${30 * MINUTE}, s-maxage=${1 * HOUR}, stale-while-revalidate=${10 * MINUTE}`,
  },
  detailsOriginal: {
    pattern: /\/details\/original/,
    cacheControl: `public, max-age=${30 * MINUTE}, s-maxage=${1 * HOUR}, stale-while-revalidate=${10 * MINUTE}`,
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
      response.headers.set('Vary', 'Cookie');
      return;
    }
  }

  response.headers.set('Cache-Control', 'no-cache');
}

function robotsMiddleware(response: NextResponse, pathname: string) {
  // Disallow indexing for certain paths
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

// Add a session_id to the cookies of the user for tracking purposes
export async function proxy(request: NextRequest) {
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
    // Cache hit (may be null if tenant was not found previously)
    if (cached && cached.enabledLocales.length && cached.defaultLocale) {
      locales = cached.enabledLocales;
      defaultLocale = cached.defaultLocale;
      tenantConfig = cached;
    }
  } else {
    const apiRoute = getApiRoute(request, 'getTenantBasicConfig');
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);

      const tenantBasicConfig: TenantBasicConfigResponse | null =
        await fetchWrapper(
          `${apiRoute}?host=${host}&secret=${process.env.PAYLOAD_API_ROUTE_SECRET}`,
          {
            headers: {
              host: rawHost,
            },
            signal: controller.signal,
            cache: 'no-store',
          },
        );

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
      // Cache the failure so we don't retry immediately
      setCachedTenantData(host, null);
      edgeLog('error', 'tenant_basic_config_fetch_failed', {
        error: error instanceof Error ? error.message : String(error),
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

  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (tenantConfig?.auth?.requiresLogin && !isAuthPath(pathname)) {
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
  robotsMiddleware(response, pathname);

  return response;
}
