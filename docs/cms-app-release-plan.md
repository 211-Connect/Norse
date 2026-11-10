# Release plan: CMS / public app split

How the split of Norse into a public component (no database) and a Payload CMS
component is deployed, for the multi-tenant deployment and MBOA. The rollout finished
on all four apps on 2026-11-05; its step-by-step plan is in this file's git history.
All DigitalOcean changes are made by hand in the dashboard. What the split is and how
the code works: [cms-app-separation-plan.md](/docs/cms-app-separation-plan.md).

## What is deployed

Each app has a `norse-cms` and a `norse-app` component. `umami` is separate and isn't
part of the split.

| App                       | Secret with its id           | `norse-cms` image            | `norse-app` image            |
| ------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| `norse-dev-search`        | `DO_MULTITENANT_DEV_APP_ID`  | `norse-cms:development`      | `norse-app:development`      |
| `norse-dev-search-mboa`   | `DO_MBOA_DEV_APP_ID`         | `norse-cms-mboa:development` | `norse-app-mboa:development` |
| `norse2-prod-search`      | `DO_MULTITENANT_PROD_APP_ID` | `norse-cms:production`       | `norse-app:production`       |
| `norse2-prod-search-mboa` | `DO_MBOA_PROD_APP_ID`        | `norse-cms-mboa:production`  | `norse-app-mboa:production`  |

The components must be named exactly `norse-cms` and `norse-app`: the variables below
refer to them by name. Each `norse-cms` has its app's database, Redis and media bucket.

MBOA's images have the base path, trailing slashes and the geospatial filtering flag
baked in by `deploy-images.yaml`, and Umami in production only.

### How CI deploys

`deploy-images.yaml` (called by the development and production deploys):

1. Builds and pushes both CMS images, then waits for each app's new deployment.
2. Only then builds and pushes both public images, and waits again.
3. Development only: runs e2e against the dev hosts, MBOA included.

So each release is two deployments per app. A failed CMS deploy leaves the public
components on the previous release and alerts Slack.

- **Development** deploys on a push to `development` that changes the app, or with
  Run workflow.
- **Production** deploys only on a `v*` tag, multi-tenant and MBOA together, with no
  separate approval and no manual trigger. To retry a failed release, use **Re-run
  jobs** on the tag's run, or create a new tag if the fix needs new code.

## Networking

`norse-app` calls `norse-cms` over the app's private network, using
`${norse-cms.PRIVATE_URL}`. That traffic never leaves the app, so it can't hit the
Cloudflare WAF.

Admins need a public hostname, because the admin's static files differ from the
public app's, so it can't share a hostname with it by path. Each CMS domain has a
routing rule **above** the rule matching all domains, with the prefix `/`, so paths
arrive unchanged:

| App                       | CMS domain                                       |
| ------------------------- | ------------------------------------------------ |
| `norse-dev-search`        | `dev-cms.c211.io`                                |
| `norse-dev-search-mboa`   | `stg-mboa-cms.c211.io`                           |
| `norse2-prod-search`      | `cms.c211.io`, `payload-administration.c211.io`  |
| `norse2-prod-search-mboa` | `mboa-cms.c211.io`                               |

`CMS_ADMIN_URL` on `norse2-prod-search` is `https://cms.c211.io`, and
`payload-administration.c211.io` is an extra way in. It is also that app's `PRIMARY`
domain, so keep it there or choose another primary before removing its rule.

**MBOA URLs include the base path.** The MBOA images serve everything under
`/adresources`, with trailing slashes, so its admin is at
`https://mboa-cms.c211.io/adresources/admin/`. `https://mn.gov/adresources/` reaches
`norse-app` through mn.gov's proxy.

## Environment variables

Set these at **component level**. Check where `DATABASE_URI` and the other CMS-only
variables are set today: if they are at app level, every component inherits them,
including `norse-app`. Move them to the components that need them.

Each app has its own `PAYLOAD_API_ROUTE_SECRET`. To replace it, generate a value with
`openssl rand -base64 32` and set it on both components in the same change.

**App-specific values**

| Variable                   | Component   | Multi-tenant                 | MBOA                                       |
| -------------------------- | ----------- | ---------------------------- | ------------------------------------------ |
| `PAYLOAD_API_ROUTE_SECRET` | both        | same on both                 | same on both                               |
| `PAYLOAD_CMS_URL`          | `norse-app` | `${norse-cms.PRIVATE_URL}`   | `${norse-cms.PRIVATE_URL}/adresources`     |
| `CMS_ADMIN_URL`            | both        | `https://cms.c211.io`        | `https://mboa-cms.c211.io/adresources`     |
| `INTERNAL_APP_URL`         | `norse-cms` | `${_self.PRIVATE_URL}`       | `${_self.PRIVATE_URL}` (no base path: the code adds it) |

`CMS_ADMIN_URL` must be the public URL, because browsers follow it: password-reset
links on `norse-cms`, and the redirect from `<tenant host>/admin` on `norse-app`.

`INTERNAL_APP_URL` is required: its default is loopback, which doesn't work on App
Platform, and scheduled PDF delivery needs it.

**Everything else**: "Public" is `norse-app`, "CMS" is `norse-cms`.

| Variable                                                                 | Public | CMS |
| ------------------------------------------------------------------------ | :----: | :-: |
| `API_URL`, `INTERNAL_API_KEY` (Norse API)                                | ✓      | ✓   |
| `CACHE_REDIS_URI` (same Redis within a pair)                             | ✓      | ✓   |
| `KEYCLOAK_BASE_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_INTERNAL_SECRET`    | ✓      | ✓   |
| `OTEL_EXPORTER_OTLP_USERNAME`, `OTEL_EXPORTER_OTLP_PASSWORD`, `OTEL_SERVICE_NAME` (a different name per component) | ✓ | ✓ |
| `PROMETHEUS_TOKEN`, `OTEL_*`, `NEXT_PUBLIC_LOG_LEVEL`                    | ✓      | ✓   |
| `NEXTAUTH_SECRET` / `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXTAUTH_URL`     | ✓      |     |
| `ARCJET_*`                                                               | ✓      |     |
| `EMS_SERVICE_URL`, `WEBHOOK_ALERT_URL`, `GOOGLE_SITE_VERIFICATION`       | ✓      |     |
| `CUSTOM_AUTH_HOST`, `CUSTOM_AUTH_PROTOCOL` (MBOA)                        | ✓      |     |
| `DATABASE_URI`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`, `DATABASE_POOL_IDLE_TIMEOUT_MS`, `PAYLOAD_SECRET` |        | ✓   |
| `MEDIA_S3_*`, `MEDIA_DO_CDN_ENDPOINT`                                    |        | ✓   |
| `SENDGRID_API_KEY`                                                       |        | ✓   |
| `KEYCLOAK_ADMIN_CLIENT_ID`, `KEYCLOAK_ADMIN_SECRET`                     |        | ✓   |
| `STRAPI_URL`, `STRAPI_TOKEN`                                             |        | ✓   |
| `GOOGLE_TRANSLATE_CREDENTIALS_BASE64`, `AZURE_TRANSLATOR_*`              |        | ✓   |
| `UMAMI_API_URL`, `UMAMI_USERNAME`, `UMAMI_PASSWORD`, `UMAMI_TEAM_ID`     |        | ✓   |
| `PAYLOAD_APP_CONFIG_API_KEY`                                             |        | ✓   |

This list comes from the variables each built image reads, plus a search of the
source for the ones read indirectly (such as `KEYCLOAK_ADMIN_*`, which a scan of the
image misses). `NEXT_PUBLIC_API_URL` is no longer read by anything. `NEXT_PUBLIC_*`
values are baked in from GitHub at build time.

Do not set `NORSE_ROLE`: the role is baked into the images, and a different value
makes the server refuse to start. `NEXT_PUBLIC_CUSTOM_BASE_PATH` and
`NEXT_PUBLIC_WITH_TRAILING_SLASHES` are baked in too, so they have no effect at
runtime. `CUSTOM_AUTH_HOST`, `CUSTOM_AUTH_PROTOCOL` and `NEXTAUTH_URL` go on MBOA's
`norse-app`.

## Component settings (dashboard)

Both components are container images from DigitalOcean Container Registry, with
**autodeploy on**. Leave the run command empty: the image defines it.

| Setting      | Multi-tenant    | MBOA                       |
| ------------ | --------------- | -------------------------- |
| Health check | `/api/health`   | `/adresources/api/health/` |

`norse-cms` has `initial_delay_seconds: 60` on its health check, because it runs
migrations on start. It also renders PDFs and runs jobs.

Production sizes:

| App                       | Size               | `norse-app` instances | `norse-cms` instances |
| ------------------------- | ------------------ | --------------------- | --------------------- |
| `norse2-prod-search`      | `apps-d-1vcpu-4gb` | 3-10 (autoscaling)    | 2                     |
| `norse2-prod-search-mboa` | `apps-d-1vcpu-2gb` | 2-4 (autoscaling)     | 2                     |

Every `norse-cms` instance runs `payload migrate` on start and the Payload job crons;
Payload locks queued jobs across instances.

Keep spec files out of the repository: they hold secrets. Download an app's spec
(Settings → App Spec) before editing it.

## Checks

`<base>` is empty for multi-tenant and `/adresources` for MBOA, whose URLs end in `/`.
E2E does not run on production, so check it by hand after a risky change.

**CMS**

- `https://<cms domain><base>/` redirects to the admin, and you can sign in.
- `https://<cms domain><base>/en` is a 404.
- `https://<cms domain><base>/api/healthz` reports Postgres and Redis `ok`.

**Private connection**, from `norse-app`'s Console tab. It prints the status and tenant
id, because the response holds tenant credentials. Without the header the status is `401`:

```bash
node -e "fetch(process.env.PAYLOAD_CMS_URL + '/api/internal/tenants/by-host?host=<tenant host>', { headers: { 'x-internal-api-key': process.env.PAYLOAD_API_ROUTE_SECRET } }).then(async r => console.log(r.status, (await r.json().catch(() => null))?.id))"
```

On MBOA use `/api/internal/tenants/by-host/?host=<tenant host>`.

**Public app**

- `norse-app`'s logs show no `cms_request_failed` or
  `tenant_basic_config_fetch_failed`.
- Pages load with the right branding and locales on several tenants, and search works.
  On MBOA check `https://mn.gov/adresources/` in a browser: mn.gov's bot protection
  blocks `curl`.
- Sign-in works on a tenant with accounts, a login-wall tenant still requires login,
  and MBOA sign-in works.
- `<tenant host>/admin` redirects to the same page on the CMS domain, and
  `/api/users/me` is 404.
- `/api/healthz` on a tenant host reports Postgres `disabled`.

**What needs the CMS**

- Printable directories: auto-translation on save, cover or logo upload, "Send to
  me now". The last one checks PDF rendering through `INTERNAL_APP_URL`.
- A scheduled PDF delivery.
- An admin edit (tenant branding, say) reaches the public site within a minute.
- A password-reset email links to the CMS domain.
- Translation jobs, and the admin's Analytics and Scorecards pages.

## Testing on another hostname

To try a build or change on a hostname that isn't live, add it as an `ALIAS` domain
with a rule to `norse-app` above the all-domains rule. Add it to the tenant's
`trustedDomains`, **last in the list**, because several features use the first entry as
the tenant's main domain. Remove it from both places afterwards. Sign-in on such a
domain redirects to the domain in `NEXTAUTH_URL`.

## Rollback

CI tags every image with `sha-<short commit>`, and tag builds also with the version
(for example `2.32.0`). To go back, set `tag` in the spec to the previous value on
`norse-app`, then on `norse-cms`. A pinned component ignores new releases until you set
its tag back to `production`.

Check the migrations first. Old code is only safe while it still works with the current
schema, and `norse-cms` doesn't undo migrations on the way back.

## Logs to watch

| Event                              | App    | Meaning                                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `cms_request_failed`               | public | A call to the CMS failed. See `status`, `body`, and `cfRay` (set means it went through Cloudflare). |
| `tenant_basic_config_fetch_failed` | public | The proxy could not read a tenant's locales and login wall, so the page got defaults, **without its login wall**. |
| `CMS internal API route failed`    | CMS    | An `/api/internal/*` handler threw and answered 500.                                         |

The secret is never logged in full: `tenant_basic_config_fetch_failed` shows its
first and last 4 characters (`secret`), enough to spot a mismatch within a pair.
