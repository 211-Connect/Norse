import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // Step 1: Use the incoming request
  const defaultLocale = request.headers.get('x-default-locale') || 'en';

  // Step 2: Create and call the next-intl middleware
  const handleI18nRouting = createIntlMiddleware({
    locales: ['en', 'es'],
    defaultLocale,
  });
  const response = handleI18nRouting(request);

  // Step 3: Alter the response
  response.headers.set('x-default-locale', defaultLocale);

  let sessionId: string | undefined;
  if (request.cookies.has('session-id')) {
    sessionId = request.cookies.get('session-id')?.value;
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID().replaceAll('-', '');
  }

  response.cookies.set({
    name: 'session-id',
    value: sessionId,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
