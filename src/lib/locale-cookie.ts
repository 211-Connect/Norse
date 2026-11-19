/**
 * The cookie holding the visitor's chosen language (`next-i18n-router`'s default name). The proxy reads it
 * to resolve an unprefixed path: `/search?…` is served in English, or redirected to `/es/search?…` when it
 * says `es`.
 *
 * Only two things write it: the proxy on a document navigation to a locale-prefixed path (someone opened an
 * `/es/…` link), and the language switcher's `POST /api/locale`. See
 * `src/middlewares/localeCookieMiddleware.ts` for why background requests must not.
 */
export const LOCALE_COOKIE = 'NEXT_LOCALE';

/** Attributes both writers give the cookie, so one never leaves a second copy beside the other's. */
export const localeCookieOptions = () => ({
  path: '/',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
});
