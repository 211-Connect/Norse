import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  COOKIE_SESSION_ID,
  COOKIE_TENANT_ID,
  IS_DEVELOPMENT,
  PREV_SEARCH,
  TENANT_ID,
  USER_PREF_COORDS,
  USER_PREF_LOCATION,
} from './lib/constants';

const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next/|.*\\..*).*)'],
};

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  const pathname = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  const coords = searchParams.get('coords');
  const location = searchParams.get('location');

  if (pathname === '/search' && searchParams.size > 0) {
    response.cookies.set({
      name: PREV_SEARCH,
      value: searchParams.toString(),
      path: '/',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  if (pathname === '/search' && coords && location) {
    response.cookies.set({
      name: USER_PREF_COORDS,
      value: coords,
      path: '/',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
      sameSite: 'lax',
    });

    response.cookies.set({
      name: USER_PREF_LOCATION,
      value: location,
      path: '/',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
      sameSite: 'lax',
    });
  } else if (pathname === '/search') {
    response.cookies.delete(USER_PREF_COORDS);
    response.cookies.delete(USER_PREF_LOCATION);
  }

  if (!request.cookies.has(COOKIE_SESSION_ID)) {
    response.cookies.set({
      name: COOKIE_SESSION_ID,
      value: crypto.randomUUID().replaceAll('-', ''),
      path: '/',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  if (!request.cookies.has(COOKIE_TENANT_ID)) {
    response.cookies.set({
      name: COOKIE_TENANT_ID,
      value: TENANT_ID || '',
      path: '/',
      secure: !IS_DEVELOPMENT,
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return response;
}
