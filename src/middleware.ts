import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { SESSION_ID } from './shared/lib/constants';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|trpc|_next|_vercel|_next/static|_next/image|admin|.*\\..*).*)',
  ],
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

  const response = NextResponse.next();
  response.cookies.set({
    name: SESSION_ID,
    value: sessionId,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return createMiddleware(routing)(request);
}
