import { NextResponse, userAgent } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { SESSION_ID } from './app/shared/lib/constants';
import i18nConfig from './i18nConfig';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!adresources/api/auth|api/auth|api|_next/static|_next/image|images|favicon.ico).*)',
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

// Add a session_id to the cookies of the user for tracking purposes
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  const searchCorrectionResponse = searchLinkCorrectionMiddleware(request);
  if (searchCorrectionResponse) {
    return searchCorrectionResponse;
  }

  // Get trailing slash config from environment
  const enableTrailingSlashRemoval =
    process.env.ENABLE_TRAILING_SLASH_REMOVAL === 'true';

  if (
    enableTrailingSlashRemoval &&
    request.method === 'POST' &&
    pathname.endsWith('/')
  ) {
    url.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(url, 308); // preserve method
  }

  // Handle trailing slash removal for /adresources paths
  if (
    enableTrailingSlashRemoval &&
    pathname.startsWith('/adresources/') &&
    pathname.endsWith('/') &&
    pathname !== '/adresources/'
  ) {
    url.pathname = pathname.slice(0, -1); // remove trailing slash
    return NextResponse.redirect(url);
  }

  // Session ID handling
  let sessionId: string | undefined;
  if (request.cookies.has(SESSION_ID)) {
    sessionId = request.cookies.get(SESSION_ID)?.value;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID().replaceAll('-', '');
  }

  let response = i18nRouter(request, i18nConfig);
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
