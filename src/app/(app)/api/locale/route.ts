import { NextRequest, NextResponse } from 'next/server';

import { LOCALE_COOKIE, localeCookieOptions } from '@/lib/locale-cookie';
import { isValidLocale } from '@/payload/i18n/locales';

/**
 * Records the language picked in the language switcher (`{ "locale": "es" }`), before it navigates. See
 * docs/locale-routing.md.
 *
 * A route handler rather than a Server Action: a Server Action that sets a cookie makes Next re-render the
 * current page (a whole search) for a response the switcher throws away.
 *
 * The tenant's own locales are not checked: the proxy ignores a cookie that is not one of them. Only
 * same-origin requests are accepted, so another site cannot change a visitor's language.
 */
export async function POST(request: NextRequest) {
  const site = request.headers.get('sec-fetch-site');
  if (site !== null && site !== 'same-origin') {
    return new NextResponse(null, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const locale =
    body && typeof body === 'object' && 'locale' in body
      ? body.locale
      : undefined;
  if (!isValidLocale(locale)) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(LOCALE_COOKIE, locale as string, localeCookieOptions());
  return response;
}
