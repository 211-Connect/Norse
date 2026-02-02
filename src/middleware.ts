import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';
import { TenantLocaleResponse } from './app/(payload)/api/getTenantLocales/route';
import { parseHost } from './app/(app)/shared/utils/parseHost';
import { fetchWrapper } from './app/(app)/shared/lib/fetchWrapper';

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
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const host =
    process.env.NODE_ENV !== 'development'
      ? request.headers.get('host')
      : 'localhost:3000';
  return `${proto}://${host}${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/api/${target}`;
}

function generateNonce() {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  return nonce;
}

// Add a session_id to the cookies of the user for tracking purposes
export async function middleware(request: NextRequest) {
  const nonce = generateNonce();

  const host = parseHost(request.headers.get('host') || '');

  let locales = ['en'];
  let defaultLocale = 'en';

  const apiRoute = getApiRoute(request, 'getTenantLocales');
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);

    const tenantLocales: TenantLocaleResponse | null = await fetchWrapper(
      `${apiRoute}?host=${host}&secret=${process.env.PAYLOAD_API_ROUTE_SECRET}`,
      {
        headers: {
          host: request.headers.get('host') || '',
        },
        signal: controller.signal,
        cache: 'no-store',
      },
    );
    clearTimeout(timeoutId);
    timeoutId = undefined;

    if (tenantLocales?.enabledLocales.length && tenantLocales.defaultLocale) {
      locales = tenantLocales.enabledLocales;
      defaultLocale = tenantLocales.defaultLocale;
    } else {
      console.warn(
        `No locales configured for tenant ${host}, falling back to defaults.`,
      );
    }
  } catch (error) {
    console.error(`Failed to fetch tenant locales for ${host}`, error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
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

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('x-nonce', nonce);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  cacheControlMiddleware(response, pathname);
  robotsMiddleware(response, pathname);

  return response;
}
