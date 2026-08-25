# Agents: e2e (Playwright)

Scope: `e2e/**`. Read this before adding or editing Playwright specs or helpers.

## Waiting rules

1. **Prefer web-first assertions and `expect.poll` over sleeps.** Never add a
   raw `page.waitForTimeout(ms)`. The one accepted exception is asserting
   "nothing changed after a keyboard action," using the named constant
   `KEYBOARD_UI_STABILITY_MS` from `timeouts.ts` — not a bare number.
2. **Always use the named constants in `timeouts.ts`, never a raw ms
   literal.** If nothing fits, add a new named constant with a doc comment
   explaining what it budgets for — don't inline a number.
3. **`networkidle` is a fallback, not a default.** Use
   `page.waitForLoadState('networkidle')` only where no concrete UI-completion
   signal exists (auth/IdP redirect chains, cleanup loops polling for
   transient cards). Where a signal exists — a testid becoming visible, a URL
   matching, a container appearing — assert on that instead and drop
   `networkidle`. `waitForPageStabilized()` (networkidle + toploader-hidden)
   is the accepted base primitive for "settle after navigation."
4. Value comparisons across state changes (e.g. a result count compared
   before/after a language switch) must poll until the value is **stable**
   (unchanged across two reads), not just present — see
   `getResultTotalNumber` in `helpers/search.ts` for the pattern.

## Selectors

- Prefer `data-testid` and ARIA roles. Treat XPath sibling/ancestor traversal
  and Tailwind-class-based selectors as a known liability, not a pattern to
  copy (see `getFavoritesDialogListActionButton` and
  `getCheckedFilterDisplayedCount` in `helpers/favorites.ts` /
  `helpers/filters.ts` — both still use them; hardening these to testids
  requires editing app components and is intentionally out of scope for
  helper-only refactors).
- Text-based assertions on user-facing copy (`getByText('Added to list')`,
  `/nothing here yet/i`, etc.) are fragile to copywriting changes and only
  exercise English. Known, accepted risk — not blocking, but don't add more
  of them if a testid is available.

## Multi-tenant test matrix

The full suite (`search-taxonomy`, `translations`, `search-geocode`,
`favorites`, `accessibility`, `ai-classification`) runs against 5 tenants ×
2 environments (dev/prod) in CI — see `.github/workflows/e2e-tests.yaml` for
the matrix (base URLs, per-cell test email) and `e2e/fixtures/tenants.ts` for
the per-tenant data (taxonomy codes/labels, broad queries, `aiSearchEnabled`).

- Test accounts: one account per matrix cell, email deterministic
  (`test-<tenant>-<env>@c211.io`, e.g. `test-wa-dev@c211.io`), all sharing a
  single `TEST_USER_PASSWORD` GitHub secret — not a per-cell secret. Each
  account must actually exist in that tenant/env's Keycloak realm with that
  shared password. To add another tenant, create its 2 accounts and add its
  matrix rows — no new secrets needed.

- Tenant is selected locally via `E2E_TENANT_KEY` (`MBOA` | `WA` | `VA` |
  `PA` | `AZ`, defaults to `MBOA`); environment via `E2E_TENANT_ENV` (`dev` |
  `prod`, defaults to `dev`). Both only affect fixture lookups in
  `e2e/fixtures/tenants.ts` — `playwright.config.ts`'s `baseURL` still comes
  from `E2E_BASE_URL` as before; CI sets all three env vars together per
  matrix cell.
- No hosts-file tricks needed: tenant resolution is by request `Host` header
  (`findResourceDirectoryByHost`), so pointing `E2E_BASE_URL` at any real
  tenant domain is sufficient.
- Real data, no mocks: fixture values are live taxonomy codes/labels gathered
  by crawling each tenant's site, not invented or synthetic. All
  fixture-driven assertions stay content-presence (`> 0`, element visible),
  never exact counts, since live data changes over time — same rule that
  already applied to `BROAD_QUERIES` in `search-taxonomy.spec.ts`.
- Not every tenant has a facets/filters panel configured (currently VA and AZ
  don't). `TenantFixture.hasFacets` (`e2e/fixtures/tenants.ts`) records this;
  facet/filter-dependent tests are gated behind `hasFacetsForCurrentTenant()`
  (`test.skip` at the top of the `Search Filters` describe in
  `search-taxonomy.spec.ts`, and inside the filter-persistence test in
  `translations.spec.ts`) rather than failing or self-skipping on an empty
  checkbox count.
- `search-ai-classification.spec.ts` self-skips entirely unless
  `isAiSearchEnabledForCurrentTenant()` is true (currently WA dev and VA dev
  only). Its Case B/D-derived tests do **not** self-skip or branch on the live
  classifier's outcome: each uses a real, hand-verified query from
  `tenant.aiScenarioQueries` (`e2e/fixtures/tenants.ts`) that
  deterministically triggers one specific `AiClassificationScenario`. If a
  query stops triggering the scenario it was picked for, the test should
  fail loudly — fix it by finding a new verified query, not by
  reintroducing skip/branch logic.

## Helper module map (`e2e/helpers/`)

Barrel `index.ts` re-exports everything plus the customized `test`/`expect`
— specs import from `./helpers`, never from an individual module file.

| Module          | Contents                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `url.ts`        | URL predicates, `expectPageUrl`, integer/text parsing, regex-escaping utils                                                |
| `navigation.ts` | `goHome`, `waitForPageStabilized`, `expectAuthenticatedShell`                                                              |
| `search.ts`     | Search dialog, `performSearch`, `searchAndGetFirstResult`, result-total/title getters, topic search, location filter setup |
| `filters.ts`    | Filter-panel helpers (`markFiltersByIds`, `markFirstNEnabledFilters`, etc.)                                                |
| `favorites.ts`  | Favorites navigation, list-page waits, dialog add/remove flows                                                             |
| `auth.ts`       | `loginViaKeycloak`                                                                                                         |
| `i18n.ts`       | `switchLanguage`                                                                                                           |
| `internal.ts`   | Non-exported-from-barrel internals (e.g. `isVisible` for branching logic)                                                  |

New helpers go in the module matching their domain, not back into a flat
file. If a helper doesn't fit an existing module, that's a signal to add one
rather than to grow `url.ts`/`navigation.ts` into a dumping ground.

## Authenticated favorites: log in once, not per test

Both `favorites.spec.ts` and `local-favorites.spec.ts` run under the same
`favorites` Playwright project — there's no separate auth-only project or
`setup` step in `playwright.config.ts`. Playwright gives every `test()` a
fresh `BrowserContext` by default, so calling `loginViaKeycloak` in a
per-test `beforeEach` would mean a full Keycloak redirect + credential fill

- submit on **every single test**, not just once. Instead, login happens
  once per file via `favorites.spec.ts`'s own `beforeAll` + `test.use`:

1. `test.beforeAll` logs in via `loginViaKeycloak` using a dedicated
   `browser.newContext({ storageState: undefined })` — the explicit
   `undefined` guarantees this context can never accidentally pick up a
   stale/leftover session file; it must always be a real, fresh login. It
   then saves that session with
   `context.storageState({ path: AUTH_STORAGE_STATE_PATH })`
   (`e2e/env.ts`, gitignored under `e2e/.auth/`).
2. `test.use({ storageState: hasAuth ? AUTH_STORAGE_STATE_PATH : undefined })`
   is declared at the top of the `describe` block. This is evaluated once at
   file-collection time (before the file on disk exists yet), but
   `storageState` is only _read_ lazily — when Playwright actually creates
   each test's `page`/`context` fixture, which happens after `beforeAll` has
   already written the file. That ordering is the load-bearing assumption
   here; if you ever see intermittent "not authenticated" failures on the
   _first_ test only, look here first.
3. `storageState` is `undefined` (not a path) when `hasTestCredentials` is
   false, so a credential-less run never tries to read a nonexistent file —
   it just skips every test in the block via the existing
   `test.skip(!hasAuth, ...)`.
4. `test.afterAll`'s cleanup uses `browser.newContext({ storageState: AUTH_STORAGE_STATE_PATH })`
   explicitly — `browser.newContext()`/`newPage()` don't inherit the
   describe-level `test.use()` override (that only applies to the
   fixture-provided `page`/`context`), so the path has to be passed again.
   It's guarded by `existsSync(AUTH_STORAGE_STATE_PATH)` first: if
   `beforeAll` itself failed (bad credentials, IdP unreachable, etc.) before
   ever writing the file, `afterAll` throws its own clear "no saved session"
   error instead of a confusing ENOENT that masks `beforeAll`'s real error.
5. Both `beforeAll` and `afterAll` call `expectAuthenticatedShell(page)`
   explicitly, even though `loginViaKeycloak` already asserts this
   internally at its own end. This is deliberate belt-and-braces: the guard
   is visible at the exact call site, so it doesn't silently depend on
   `loginViaKeycloak`'s internals never changing.
6. `test.beforeEach(async ({ page }) => { await goHome(page); })` is
   **required** here, unlike other spec files where it's just a convention —
   `test.use({ storageState })` only preloads cookies/localStorage into each
   test's fresh context, it does **not** navigate anywhere. Without this
   `beforeEach`, every test starts on a blank page and the first
   `favorites-btn`/`search-trigger` interaction fails ("white screen"). This
   used to be a side effect of the old per-test `loginViaKeycloak` call
   (which itself called `goHome`); now that login happens once in
   `beforeAll`, the per-test navigation has to be explicit. If you ever
   remove or reorder this hook, expect every test to fail immediately with
   an "element not found" error on the first interaction.

If you add more authenticated tests, put them in `favorites.spec.ts` (or
mirror this exact `test.use` + `beforeAll` + `beforeEach(goHome)` pattern in
a new file) rather than reintroducing a per-test `loginViaKeycloak` call.

**Trade-off to watch:** the captured session is reused for the whole file's
test run. If Keycloak session lifetimes are ever shortened, a very long run
could see the session expire mid-suite — not observed in practice given
current timeout budgets, but worth knowing if `favorites.spec.ts`'s
authenticated tests start failing partway through a run with auth-prompt
symptoms.

## Favorite-list naming and deletion

Every list `favorites.spec.ts` creates is tagged with a per-run `runId`
(`` `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` ``) baked into
its name (`E2E Test List <runId>`), purely to keep names unique across
concurrent runs against the same shared `TEST_USER_EMAIL`/`TEST_USER_PASSWORD`
test account/tenant — it has no bearing on cleanup. Lists are deleted by id
via `deleteFavoriteList(page, listName)` (`helpers/favorites.ts`), called
directly in the test that owns the list, not from a broad `beforeAll`/
`afterAll` sweep.

## Known risks (documented, not fixed here)

- **Data-dependent tests silently skip**: several tests call
  `test.skip(total <= 10, ...)` (or similar) when the tenant's seeded data is
  too thin to exercise the scenario (pagination, multi-filter persistence,
  taxonomy suggestions). These pass green while testing nothing on
  data-poor environments. No seed-data/fixture strategy exists yet — deciding
  one is a separate piece of work, not a helper refactor.
- **Favorites list-detail URL regex** (`FAVORITES_LIST_URL_RE` in
  `helpers/favorites.ts`) is intentionally permissive (`{24,36}` hex chars)
  because the canonical list-id format from the Norse API wasn't confirmed
  against a live run at the time of writing. Tighten it once confirmed.
- `favorites.spec.ts`'s "add a resource to the favorite list from search
  results" test has a commented-out `waitForFavoriteOnListPage` assertion
  (search `// await waitForFavoriteOnListPage`) — left as-is because the
  reason it was disabled wasn't clear from context; don't silently re-enable
  without confirming why it was skipped.
- `beforeEach(async ({ page }) => { await goHome(page); })` is repeated
  verbatim across most spec files. This was considered for extraction into a
  custom fixture and intentionally rejected: it's already a single call to a
  well-named helper, and a fixture would trade that one line for an import-time
  indirection with no real duplication removed. Leave it as an explicit
  one-liner.

## Running tests

- `npm run test:e2e` — full suite (all projects, Desktop Chrome only).
- `npm run test:e2e:<project>` — one project (`accessibility`, `favorites`,
  `translations`, `search-geocode`, `search-taxonomy`).
- Requires a running app server; `baseURL` defaults to `http://localhost:3000`,
  override with `E2E_BASE_URL`.
- Favorites (authenticated) specs skip automatically unless `TEST_USER_EMAIL`
  and `TEST_USER_PASSWORD` are set — see "Authenticated favorites" above.
- All `E2E_*_TIMEOUT_MS` env vars in `timeouts.ts` are overridable per-run —
  use them to debug flakiness on a slow environment before assuming a bug.
