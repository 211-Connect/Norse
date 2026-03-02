import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';
import { TenantLocaleResponse } from './app/(payload)/api/getTenantLocales/route';
import { parseHost } from './app/(app)/shared/utils/parseHost';
import { fetchWrapper } from './app/(app)/shared/lib/fetchWrapper';

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

const LOCALE_CACHE_TTL_MS = 10 * 60 * 1000;
const LOCALE_CACHE_MAX_ENTRIES = 1_000;

type LocaleCacheEntry = {
  data: TenantLocaleResponse | null;
  expiresAt: number;
};

const tenantLocaleCache = new Map<string, LocaleCacheEntry>();

function getCachedTenantLocales(
  host: string,
): TenantLocaleResponse | null | undefined {
  const entry = tenantLocaleCache.get(host);

  if (!entry) {
    return undefined;
  }

  const expired = Date.now() > entry.expiresAt;
  if (expired) {
    tenantLocaleCache.delete(host);
    return undefined;
  }

  return entry.data;
}

function setCachedTenantLocales(
  host: string,
  data: TenantLocaleResponse | null,
): void {
  if (tenantLocaleCache.size >= LOCALE_CACHE_MAX_ENTRIES) {
    const firstKey = tenantLocaleCache.keys().next().value;
    if (firstKey) {
      tenantLocaleCache.delete(firstKey);
    }
  }

  tenantLocaleCache.set(host, {
    data,
    expiresAt: Date.now() + LOCALE_CACHE_TTL_MS,
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
    '/((?!admin|api/auth|chrome.devtools|api|_next/static|_next/image|images|favicon.ico).*)',
    { source: '/' },
  ],
};

function cacheControlMiddleware(response: NextResponse, pathname: string) {
  const requiredCachePaths = ['/search', '/details/original'];

  const isProduction = process.env.NODE_ENV === 'production';
  if (
    isProduction &&
    requiredCachePaths.some((path) => pathname.includes(path))
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600',
    );
  }
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

  return `${proto}://${host}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/api/${target}`;
}

function generateNonce() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  return nonce;
}

// Add a session_id to the cookies of the user for tracking purposes
export async function middleware(request: NextRequest) {
  const nonce = generateNonce();

  // Use raw host for headers that require it, but parsed host for logic/identification
  const rawHost = request.headers.get('host') || '';
  const host = parseHost(rawHost);

  let locales = ['en'];
  let defaultLocale = 'en';

  const cached = getCachedTenantLocales(host);

  if (cached !== undefined) {
    // Cache hit (may be null if tenant was not found previously)
    if (cached && cached.enabledLocales.length && cached.defaultLocale) {
      locales = cached.enabledLocales;
      defaultLocale = cached.defaultLocale;
    }
  } else {
    const apiRoute = getApiRoute(request, 'getTenantLocales');
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);

      const tenantLocales: TenantLocaleResponse | null = await fetchWrapper(
        `${apiRoute}?host=${host}&secret=${process.env.PAYLOAD_API_ROUTE_SECRET}`,
        {
          headers: {
            host: rawHost,
          },
          signal: controller.signal,
          cache: 'no-store',
        },
      );

      setCachedTenantLocales(host, tenantLocales);

      if (
        tenantLocales &&
        tenantLocales.enabledLocales.length &&
        tenantLocales.defaultLocale
      ) {
        locales = tenantLocales.enabledLocales;
        defaultLocale = tenantLocales.defaultLocale;
      } else {
        edgeLog('warn', 'tenant_locales_not_configured', {
          tenantLocales,
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
      setCachedTenantLocales(host, null);

      edgeLog('error', 'tenant_locales_fetch_failed', {
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

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com ${isProduction ? "'strict-dynamic'" : "'unsafe-eval' 'unsafe-inline'"};
    style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com;
    img-src 'self' blob: data: https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com https://cdn.c211.io *.digitaloceanspaces.com *.feathr.co www.googletagmanager.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://api.mapbox.com https://*.tiles.mapbox.com https://events.mapbox.com *.digitaloceanspaces.com *.feathr.co https://*.google-analytics.com https://cdn.matomo.cloud https://api.c211.io https://maps.c211.io www.googletagmanager.com www.google.com ${isProduction ? '' : 'http://localhost:* ws://localhost:*'};
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
