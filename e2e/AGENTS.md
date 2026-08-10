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

## Helper module map (`e2e/helpers/`)

Barrel `index.ts` re-exports everything plus the customized `test`/`expect`
— specs import from `./helpers`, never from an individual module file.

| Module | Contents |
|---|---|
| `url.ts` | URL predicates, `expectPageUrl`, integer/text parsing, regex-escaping utils |
| `navigation.ts` | `goHome`, `waitForPageStabilized`, `expectAuthenticatedShell` |
| `search.ts` | Search dialog, `performSearch`, `searchAndGetFirstResult`, result-total/title getters, topic search, location filter setup |
| `filters.ts` | Filter-panel helpers (`markFiltersByIds`, `markFirstNEnabledFilters`, etc.) |
| `favorites.ts` | Favorites navigation, list-page waits, dialog add/remove flows, cleanup |
| `auth.ts` | `loginViaKeycloak` |
| `i18n.ts` | `switchLanguage` |
| `internal.ts` | Non-exported-from-barrel internals (e.g. `isVisible` for branching logic) |

New helpers go in the module matching their domain, not back into a flat
file. If a helper doesn't fit an existing module, that's a signal to add one
rather than to grow `url.ts`/`navigation.ts` into a dumping ground.

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
  and `TEST_USER_PASSWORD` are set.
- All `E2E_*_TIMEOUT_MS` env vars in `timeouts.ts` are overridable per-run —
  use them to debug flakiness on a slow environment before assuming a bug.
