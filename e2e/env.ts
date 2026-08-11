/**
 * Shared between `playwright.config.ts`, `auth.setup.ts`, and
 * `favorites.spec.ts` to avoid duplicating the credential check and the
 * storage-state file path in three places.
 */
export const hasTestCredentials =
  !!process.env.TEST_USER_EMAIL && !!process.env.TEST_USER_PASSWORD;

/**
 * Where the authenticated session (cookies + localStorage) captured by
 * `auth.setup.ts` is persisted. Gitignored (`e2e/.auth/`). Only read when
 * `hasTestCredentials` is true — see `playwright.config.ts`'s
 * `favorites-authenticated` project, which omits `storageState` entirely
 * otherwise (loading a non-existent path would fail context creation before
 * any in-test `test.skip` check runs).
 */
export const AUTH_STORAGE_STATE_PATH = 'e2e/.auth/user.json';
