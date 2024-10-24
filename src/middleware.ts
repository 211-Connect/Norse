import { NextResponse, NextRequest } from 'next/server';
import { SESSION_ID } from './shared/lib/constants';

// Add a session_id to the cookies of the user for tracking purposes
export async function middleware(request: NextRequest) {
  const currentLocale = request.nextUrl.pathname.split('/')[1];

  console.log(currentLocale);

  let response: NextResponse;
  if (!currentLocale) {
    const existingParams = new URLSearchParams(request.nextUrl.searchParams);

    const _queryParams = existingParams.toString();
    const queryParams = _queryParams ? `?${_queryParams}` : '';

    response = NextResponse.redirect(
      `${request.nextUrl.origin}/${'en'}${queryParams}`,
      307,
    );
  } else {
    response = NextResponse.next();
  }

  let sessionId: string | undefined;
  if (request.cookies.has(SESSION_ID)) {
    sessionId = request.cookies.get(SESSION_ID)?.value;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID().replaceAll('-', '');
  }

  response.cookies.set({
    name: SESSION_ID,
    value: sessionId,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    '/',
  ],
};
