import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { i18nRouter } from 'next-i18n-router';

import { SESSION_ID } from './app/(app)/shared/lib/constants';
import { searchLinkCorrectionMiddleware } from './middlewares/searchLinkCorrectionMiddleware';
import { Tenant } from './payload/payload-types';
import { BASE_PATH_MAPPER } from './basePathMapper';
import { parseHost } from './app/(app)/shared/utils/getHost';

const excludeFromPagesLogic = [
  'admin',
  'api/auth',
  'chrome.devtools',
  'api',
  '_next/static',
  '_next/image',
  'images',
  'favicon.ico',
];

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

function isPageRequest(pathname: string) {
  return !excludeFromPagesLogic.some((path) => pathname.includes(path));
}

function getApiRoute(
  request: NextRequest,
  target: string,
  basePath: string = '',
) {
  return request.nextUrl.origin + basePath + `/api/${target}`;
}

// Add a session_id to the cookies of the user for tracking purposes
export async function middleware(request: NextRequest) {
  const host = parseHost(request.headers.get('host') || '');

  const basePath = BASE_PATH_MAPPER[host];

  const isPageRequestResult = isPageRequest(request.nextUrl.pathname);

  if (!basePath && !isPageRequestResult) {
    return NextResponse.next();
  }

  if (basePath && !request.nextUrl.pathname.startsWith(basePath)) {
    const url = request.nextUrl.clone();
    url.pathname = basePath + request.nextUrl.pathname;
    return NextResponse.redirect(url);
  }

  if (!isPageRequestResult) {
    const url = request.nextUrl.clone();
    url.pathname = request.nextUrl.pathname.replace(basePath, '');
    return NextResponse.rewrite(url);
  }

  let locales = ['en'];
  let defaultLocale = 'en';

  const apiRoute = getApiRoute(request, 'getTenant', basePath);
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
    request.nextUrl.basePath = basePath;
    request.nextUrl.pathname = request.nextUrl.pathname.replace(basePath, '');
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
    basePath,
    defaultLocale,
    locales,
  };
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

  if (basePath) {
    const locationHeader = response.headers.get('location');
    if (locationHeader) {
      return NextResponse.redirect(locationHeader);
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = request.nextUrl.pathname.replace(basePath, '');
    const rewriteResponse = NextResponse.rewrite(rewriteUrl);

    response.cookies.getAll().forEach((cookie) => {
      rewriteResponse.cookies.set(cookie);
    });

    response.headers.forEach((value, key) => {
      switch (key) {
        case 'x-middleware-rewrite':
          rewriteResponse.headers.set(key, value.replace(basePath, ''));
          break;
        default:
          rewriteResponse.headers.set(key, value);
      }
    });

    return rewriteResponse;
  }

  return response;
}
