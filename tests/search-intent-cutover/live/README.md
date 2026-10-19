# Live parity runner (ISS-2372)

Cut-over scaffolding: it records the live baseline now and the sign-off diff in ISS-2377, then ISS-2377
deletes it. It catches what the deterministic snapshots cannot: the real classifier, real geocoding, real
results and what the browser shows.

**It visits live tenant sites. Run `run.ts` only with sign-off.** Each run sends up to `--cap` visits
(default 50) per tenant, one at a time, `--delay-ms` (default 1000) apart. On AI tenants each visit can call
the real classifier.

## What it records, per URL

The redirect chain with statuses, the final URL, the page title, the result total and first 10 result
links, whether the clarify options showed and which, and the notify alert. It aborts every request to
another origin, so the Umami script never loads. It also blocks Feathr, maps and fonts. It sends the
User-Agent `Connect211-SearchParity/1.0` (`RUNNER_USER_AGENT` in `observe.ts`).

## Commands

```sh
# once: the browser (to the user cache, not node_modules)
npx playwright install chromium

# self-test against local stand-in sites (no live traffic); not in CI, since it needs a browser
node --import tsx --test tests/search-intent-cutover/live/live.test.ts

# dated baseline of one environment, all 7 tenants or some
node --import tsx tests/search-intent-cutover/live/run.ts baseline --env prod
node --import tsx tests/search-intent-cutover/live/run.ts baseline --env dev --tenants WA,AZ

# diff: each sampled URL on the environment (A), then on a preview build (B), back to back
node --import tsx tests/search-intent-cutover/live/run.ts diff --env prod --b WA=https://<preview-host>
```

```sh
# diff between two builds instead of an environment and a build (A overrides the environment's site)
node --import tsx tests/search-intent-cutover/live/run.ts diff --a WA=http://search.wa211.org.localhost:3003 --b WA=http://search.wa211.org.localhost:3004
```

Output goes to `live/runs/<date>-<mode>-<env>/`: one `<TENANT>.jsonl` per tenant, plus a `manifest.json`
with the cap, the User-Agent and per-tenant counts.

## Verdicts and exit codes

| Verdict            | Meaning                                                                      | Fails?           |
| ------------------ | ---------------------------------------------------------------------------- | ---------------- |
| `pass`             | same on both                                                                 | no               |
| `data`             | only the result total or ids differ                                          | no (reported)    |
| `behaviour`        | the redirect chain, final URL, title, clarify options or alert differ        | **yes**          |
| `could_not_verify` | either visit timed out, was denied (403/429), errored (5xx) or left the site | **never a pass** |

The exit code is `1` if anything changed behaviour, otherwise `2` if anything could not be verified (or
nothing was compared), otherwise `0`.

**Not observable from the browser:** the Norse-API request the server sends. The final URL stands in for
it. The request is a function of the URL and tenant config, which the `server-page` snapshots pin.

## Verified locally (2026-10-19), with no live traffic

On David's decision, no run has touched production analytics. Instead, two local production builds of the
stack served WA from the local Podman Postgres (production dump), with Valkey, a local Norse-API, and a
**local Umami** in Podman whose website id was set on WA in the local copy only.

- **Red check.** A build whose page title drops the location, against an unchanged build, over WA's 50-URL
  sample: 29 behaviour changes (all `title`) and 21 passes, matching the lift's prediction on 50 of 50 URLs
  (exactly the URLs with a real location). Exit 1.
- **Analytics.** Against the local Umami database:
  - the runner alone: 0 events (exit 2, could not verify: an empty window proves nothing);
  - one unblocked control visit: recorded and reported as a leak (exit 1);
  - ordinary traffic plus runner visits: 1 event, no leak (exit 0).

  Umami also drops `HeadlessChrome` as a bot, so the control visit had to use a desktop User-Agent.

## Before and after a live run

- **Arcjet.** Not enforcing on production today (2026-10-16). If ISS-1728 / ISS-2305 ship first, add the
  runner's User-Agent to the allow list, or its denials will show up as `could_not_verify`.
- **Analytics.** After a run, check Umami for page views with the runner's User-Agent; there must be
  none. The check needs Umami credentials, so it is run by hand.
