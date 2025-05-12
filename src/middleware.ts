import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { SESSION_ID } from './shared/lib/constants';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

// Add a session_id to the cookies of the user for tracking purposes
export function middleware(request: NextRequest) {
  let sessionId: string | undefined;
  if (request.cookies.has(SESSION_ID)) {
    sessionId = request.cookies.get(SESSION_ID)?.value;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID().replaceAll('-', '');
  }

  const response = intlMiddleware(request);
  response.cookies.set({
    name: SESSION_ID,
    value: sessionId,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return response;
}
