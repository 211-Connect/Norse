import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import {
  COOKIE_SESSION_ID,
  COOKIE_TENANT_ID,
  IS_DEVELOPMENT,
  TENANT_ID,
} from './lib/constants';

const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next/|.*\\..*).*)'],
};

export function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

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
