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
    '/((?!adresources/api/auth|api/auth|api|_next/static|_next/image|favicon.ico).*)',
  ],
};

// Add a session_id to the cookies of the user for tracking purposes
export function middleware(request: NextRequest) {
  // Log every middleware invocation
  console.log(`[middleware] Invoked for: ${request.method} ${request.nextUrl.pathname} cookies: ${request.cookies.getAll()}`);

  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Get trailing slash config from environment
  const enableTrailingSlashRemoval =
    process.env.ENABLE_TRAILING_SLASH_REMOVAL === 'true';

  if (
    enableTrailingSlashRemoval &&
    request.method === 'POST' &&
    pathname.endsWith('/')
  ) {
    console.log(`[middleware] Removing trailing slash (POST): ${pathname} -> ${pathname.slice(0, -1)}`);
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
    console.log(`[middleware] Removing trailing slash (/adresources): ${pathname} -> ${pathname.slice(0, -1)}`);
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

  const response = NextResponse.next();
  if (!request.cookies.has(SESSION_ID)) {
    response.cookies.set({
      name: SESSION_ID,
      value: sessionId,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    });
  }

  return response;
}
