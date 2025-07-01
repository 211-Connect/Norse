import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Add a session_id to the cookies of the user for tracking purposes
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Handle trailing slash removal for /adresources paths
  if (
    pathname.startsWith('/adresources/') &&
    pathname.endsWith('/') &&
    pathname !== '/adresources/'
  ) {
    url.pathname = pathname.slice(0, -1); // remove trailing slash
    console.log(`Redirecting to ${url.pathname} without trailing slash`);
    // Redirect to the same path without
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

  const response = NextResponse.next();
  response.cookies.set({
    name: SESSION_ID,
    value: sessionId,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return response;
}
