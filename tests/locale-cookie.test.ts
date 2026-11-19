import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { i18nRouter } from 'next-i18n-router';
import { NextRequest } from 'next/server';

import { POST } from '../src/app/(app)/api/locale/route';
import {
  localeSwitchHrefs,
  withoutLocalePrefix,
} from '../src/app/(app)/shared/lib/locale-switch';
import { LOCALE_COOKIE, localeCookieOptions } from '../src/lib/locale-cookie';
import { keepLocaleCookieForDocumentNavigations } from '../src/middlewares/localeCookieMiddleware';

const config = {
  defaultLocale: 'en',
  locales: ['en', 'es'],
  localeCookie: LOCALE_COOKIE,
  cookieOptions: localeCookieOptions(),
};

/**
 * A request as the proxy receives it. Next strips the App Router's own headers (`RSC`,
 * `Next-Router-Prefetch`, …) before the proxy runs, so only browser-set headers like `Sec-Fetch-Mode` tell a
 * page load from the router's background fetches.
 */
function request(
  path: string,
  { mode, method = 'GET' }: { mode?: string; method?: string } = {},
) {
  const headers: Record<string, string> = {
    cookie: `${LOCALE_COOKIE}=en; session-id=abc`,
  };
  if (mode) headers['sec-fetch-mode'] = mode;
  return new NextRequest(new URL(path, 'https://tenant.example'), {
    method,
    headers,
  });
}

/** What the proxy does: i18n routing, another cookie, then the guard. */
function proxy(req: NextRequest) {
  const response = i18nRouter(req, config);
  response.cookies.set('session-id', 'abc');
  keepLocaleCookieForDocumentNavigations(req, response);
  return response.headers.getSetCookie();
}

const localeCookie = (setCookies: string[]) =>
  setCookies
    .filter((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))
    .map((cookie) => cookie.split(';')[0]);

describe('only a document navigation changes the locale cookie', () => {
  test('a page load of /es/search sets it to es', () => {
    assert.deepEqual(
      localeCookie(proxy(request('/es/search', { mode: 'navigate' }))),
      [`${LOCALE_COOKIE}=es`],
    );
  });

  test('a request without Sec-Fetch-Mode (older browser) still sets it', () => {
    assert.deepEqual(localeCookie(proxy(request('/es/search'))), [
      `${LOCALE_COOKIE}=es`,
    ]);
  });

  for (const mode of ['cors', 'same-origin', 'no-cors']) {
    test(`a router fetch (Sec-Fetch-Mode: ${mode}) of /es leaves it alone`, () => {
      const setCookies = proxy(request('/es', { mode }));
      assert.deepEqual(localeCookie(setCookies), []);
      assert.ok(
        setCookies.some((cookie) => cookie.startsWith('session-id=')),
        'other cookies are kept',
      );
    });
  }

  test('a server action POST from an /es page leaves it alone', () => {
    assert.deepEqual(
      localeCookie(
        proxy(request('/es/search', { mode: 'same-origin', method: 'POST' })),
      ),
      [],
    );
  });

  test('an unprefixed router fetch still resolves the language from the cookie', () => {
    const req = new NextRequest(new URL('/search', 'https://tenant.example'), {
      headers: { cookie: `${LOCALE_COOKIE}=es`, 'sec-fetch-mode': 'cors' },
    });
    const response = i18nRouter(req, config);
    assert.equal(response.status, 307);
    assert.equal(
      new URL(response.headers.get('location')!).pathname,
      '/es/search',
    );
  });
});

describe('POST /api/locale', () => {
  const post = (body: unknown, site = 'same-origin') =>
    POST(
      new NextRequest('https://tenant.example/api/locale', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'sec-fetch-site': site },
        body: JSON.stringify(body),
      }),
    );

  test('sets the cookie with the proxy’s attributes', async () => {
    const response = await post({ locale: 'es' });
    assert.equal(response.status, 204);
    const [cookie] = response.headers.getSetCookie();
    assert.match(
      cookie,
      /^NEXT_LOCALE=es; Path=\/;.*HttpOnly; SameSite=strict/,
    );
  });

  test('rejects an unknown locale', async () => {
    const response = await post({ locale: 'xx' });
    assert.equal(response.status, 400);
    assert.deepEqual(response.headers.getSetCookie(), []);
  });

  test('rejects a cross-site request', async () => {
    const response = await post({ locale: 'es' }, 'cross-site');
    assert.equal(response.status, 403);
    assert.deepEqual(response.headers.getSetCookie(), []);
  });
});

describe('localeSwitchHrefs', () => {
  const hrefs = (pathname: string, from: string, to: string) =>
    localeSwitchHrefs({
      pathname,
      search: '?query=x',
      from,
      to,
      defaultLocale: 'en',
    });

  test('to the default locale: unprefixed, page load through /en', () => {
    assert.deepEqual(hrefs('/es/search', 'es', 'en'), {
      href: '/search?query=x',
      pageLoadHref: '/en/search?query=x',
    });
  });

  test('from the default locale', () => {
    assert.deepEqual(hrefs('/search', 'en', 'es'), {
      href: '/es/search?query=x',
      pageLoadHref: '/es/search?query=x',
    });
  });

  test('between two prefixed locales', () => {
    assert.deepEqual(
      hrefs('/es/search', 'es', 'vi').href,
      '/vi/search?query=x',
    );
  });

  test('the home page', () => {
    assert.deepEqual(hrefs('/es', 'es', 'en').href, '/?query=x');
    assert.deepEqual(hrefs('/', 'en', 'es').href, '/es?query=x');
  });

  test('a path that only starts with the locale letters is kept', () => {
    assert.equal(withoutLocalePrefix('/estate', 'es'), '/estate');
  });
});
