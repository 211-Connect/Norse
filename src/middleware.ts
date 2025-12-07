import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';
import { Tenant } from './payload/payload-types';
import { parseHost } from './app/(app)/shared/utils/parseHost';

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
      'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
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

// Add a session_id to the cookies of the user for tracking purposes
export async function middleware(request: NextRequest) {
  const host = parseHost(request.headers.get('host') || '');

  let locales = ['en'];
  let defaultLocale = 'en';

  const apiRoute = getApiRoute(request, 'getTenant');
  try {
    const response = await fetch(
      `${apiRoute}?host=${host}&secret=${process.env.PAYLOAD_API_ROUTE_SECRET}`,
      {
        headers: {
          host: request.headers.get('host') || '',
        },
        next: { tags: [`tenants:${host}`] },
      },
    );
    const tenant: Tenant = await response.json();

    locales = tenant.enabledLocales;
    defaultLocale = tenant.defaultLocale;
  } catch {}

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
    },
  });
  if (!request.cookies.has(SESSION_ID)) {
    response.cookies.set({
      name: SESSION_ID,
      value: sessionId,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  }

  cacheControlMiddleware(response, pathname);
  robotsMiddleware(response, pathname);

  return response;
}
