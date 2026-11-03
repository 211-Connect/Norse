# Release plan: CMS / public app split

How to roll out the split of Norse into a public component (no database) and a
Payload CMS component, for the multi-tenant deployment and MBOA at the same time.
All DigitalOcean changes are made by hand in the dashboard. What the split is and
how the code works: [cms-app-separation-plan.md](/docs/cms-app-separation-plan.md).

Development goes first and is the rehearsal for production. The existing
`norse-search` component keeps serving until you flip the routing rule, and it
stays in place afterwards, so rollback is flipping the rule back.

## What you end up with

The four apps stay. Each gets two new components, and `norse-search` goes away at
the end. `umami` isn't touched.

| App                       | Secret with its id           | `norse-cms` image            | `norse-app` image            |
| ------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| `norse-dev-search`        | `DO_MULTITENANT_DEV_APP_ID`  | `norse-cms:development`      | `norse-app:development`      |
| `norse-dev-search-mboa`   | `DO_MBOA_DEV_APP_ID`         | `norse-cms-mboa:development` | `norse-app-mboa:development` |
| `norse2-prod-search`      | `DO_MULTITENANT_PROD_APP_ID` | `norse-cms:production`       | `norse-app:production`       |
| `norse2-prod-search-mboa` | `DO_MBOA_PROD_APP_ID`        | `norse-cms-mboa:production`  | `norse-app-mboa:production`  |

Name the components exactly `norse-cms` and `norse-app`: the variables below refer
to them by name. Each `norse-cms` keeps its app's existing database, Redis and
media bucket.

### How CI deploys

`deploy-images.yaml` (called by the development and production deploys):

1. Builds and pushes both CMS images, then waits for each app's new deployment.
2. Only then builds and pushes both public images, and waits again.
3. Development only: runs e2e against the dev hosts, MBOA included.

So each release is two deployments per app. A failed CMS deploy leaves
the public components on the previous release and alerts Slack. The `images_only`
option of "Run workflow" pushes the images without waiting, for use before the
components exist.

**CI no longer builds `norse`**, so `norse-search` stays on its last image. On
development it stops receiving changes until you flip to `norse-app`. Until the new
components exist with autodeploy on, a push to `development` that changes the app
builds the CMS images and then times out waiting for a deployment (30 minutes,
then a Slack alert).

## Networking

`norse-app` calls `norse-cms` over the app's private network, using
`${norse-cms.PRIVATE_URL}`. That traffic never leaves the app, so it can't hit the
Cloudflare WAF, the cause of the original `403`s.

Admins need a public hostname, because the admin's static files differ from the
public app's, so it can't share a hostname with it by path. Add one custom domain
per app and a routing rule for it (Networking → Component routing rules → Add
routing rule):

| App                       | Domain (suggestion)    | Rule                                                |
| ------------------------- | ---------------------- | --------------------------------------------------- |
| `norse-dev-search`        | `dev-cms.c211.io`      | that domain → `norse-cms`, preserve full path       |
| `norse-dev-search-mboa`   | `stg-mboa-cms.c211.io` | that domain → `norse-cms`, preserve full path       |
| `norse2-prod-search`      | `cms.c211.io`          | that domain → `norse-cms`, preserve full path       |
| `norse2-prod-search-mboa` | `mboa-cms.c211.io`     | that domain → `norse-cms`, preserve full path       |

Keep this rule **above** the rule matching all domains.

**MBOA URLs include the base path.** The MBOA images serve everything under
`/adresources`, with trailing slashes, so its admin is at
`https://mboa-cms.c211.io/adresources/admin/`.

## Environment variables

Set these at **component level**. Check where `DATABASE_URI` and the other CMS-only
variables are set today: if they are at app level, every component inherits them,
including `norse-app`. Move them to the components that need them.

Generate one new secret per app (the old value appeared in production logs):

```bash
openssl rand -base64 32
```

**App-specific values**

| Variable                   | Component   | Multi-tenant                 | MBOA                                       |
| -------------------------- | ----------- | ---------------------------- | ------------------------------------------ |
| `PAYLOAD_API_ROUTE_SECRET` | both        | new secret, same on both     | new secret, same on both                   |
| `PAYLOAD_CMS_URL`          | `norse-app` | `${norse-cms.PRIVATE_URL}`   | `${norse-cms.PRIVATE_URL}/adresources`     |
| `CMS_ADMIN_URL`            | `norse-cms` | `https://cms.c211.io`        | `https://mboa-cms.c211.io/adresources`     |
| `INTERNAL_APP_URL`         | `norse-cms` | `${_self.PRIVATE_URL}`       | `${_self.PRIVATE_URL}` (no base path: the code adds it) |

`INTERNAL_APP_URL` is required: its default is loopback, which you found doesn't
work on App Platform, and scheduled PDF delivery needs it.

**Everything else**: copy the values from that app's `norse-search`. "Public" is
`norse-app`, "CMS" is `norse-cms`.

| Variable                                                                 | Public | CMS |
| ------------------------------------------------------------------------ | :----: | :-: |
| `API_URL`, `INTERNAL_API_KEY` (Norse API)                                | ✓      | ✓   |
| `CACHE_REDIS_URI` (same Redis within a pair)                             | ✓      | ✓   |
| `KEYCLOAK_BASE_URL`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_INTERNAL_SECRET`    | ✓      | ✓   |
| `PROMETHEUS_TOKEN`, `OTEL_*`, `NEXT_PUBLIC_LOG_LEVEL`                    | ✓      | ✓   |
| `NEXTAUTH_SECRET` / `AUTH_SECRET`, `AUTH_TRUST_HOST`, `NEXTAUTH_URL`     | ✓      |     |
| `ARCJET_*`                                                               | ✓      |     |
| `EMS_SERVICE_URL`, `WEBHOOK_ALERT_URL`, `GOOGLE_SITE_VERIFICATION`       | ✓      |     |
| `CUSTOM_AUTH_HOST`, `CUSTOM_AUTH_PROTOCOL` (MBOA)                        | ✓      |     |
| `DATABASE_URI`, `DATABASE_POOL_MIN`, `DATABASE_POOL_MAX`, `PAYLOAD_SECRET` |        | ✓   |
| `MEDIA_S3_*`, `MEDIA_DO_CDN_ENDPOINT`                                    |        | ✓   |
| `SENDGRID_API_KEY`                                                       |        | ✓   |
| `GOOGLE_TRANSLATE_CREDENTIALS_BASE64`, `AZURE_TRANSLATOR_*`              |        | ✓   |
| `UMAMI_API_URL`, `UMAMI_USERNAME`, `UMAMI_PASSWORD`, `UMAMI_TEAM_ID`     |        | ✓   |
| `PAYLOAD_APP_CONFIG_API_KEY`                                             |        | ✓   |

This list comes from the variables each built image actually reads. If `norse-search`
sets something not listed, it is probably unused; leave it off the new components
and watch the logs. Build-time `NEXT_PUBLIC_*` values are set in GitHub, not on the
components.

Do not set `NORSE_ROLE`: the role is baked into the images, and a different value
makes the server refuse to start. `NEXT_PUBLIC_CUSTOM_BASE_PATH` and
`NEXT_PUBLIC_WITH_TRAILING_SLASHES` are baked in too, so they have no effect at
runtime. `CUSTOM_AUTH_HOST`, `CUSTOM_AUTH_PROTOCOL` and `NEXTAUTH_URL` go on MBOA's
`norse-app` with their current values.

## Component settings (dashboard)

Add each with Create → Components → Container image:

| Setting      | Multi-tenant                                                 | MBOA                       |
| ------------ | ------------------------------------------------------------ | -------------------------- |
| Source       | DigitalOcean Container Registry, the image above, **autodeploy on** | same                |
| Run command  | leave empty (the image defines it)                           | same                       |
| HTTP port    | the same as `norse-search`                                   | same                       |
| Health check | `/api/health`                                                | `/adresources/api/health/` |

The CMS renders PDFs and runs jobs, so start `norse-cms` at the size of `norse-search`,
with **one instance**. Size `norse-app` like `norse-search` too, and reduce it later if
metrics allow. All three components are billed while `norse-search` is still there.

Before editing an app, **download its app spec** (Settings → App Spec).

Also add `norse-cms` to whatever watches `norse-search`: log forwarding, uptime
checks, alerts, and the Prometheus scrape list (`/api/metrics`, with
`PROMETHEUS_TOKEN`).

## Before you start

- [ ] **Registry plan:** the release adds four repositories. Check your Container
      Registry plan's repository limit and storage.
- [ ] **MBOA's routing rule:** the MBOA images expect requests with `/adresources`
      still in the path. Check that the rule pointing at `norse-search` preserves
      it. If it strips the prefix today, the rule pointing at `norse-app` must not.
- [ ] **Consumers of `/api/tenants/<id>/config`:** this route moves to the CMS
      hostname. Nothing in this repo or Norse-API calls it, so find any external
      consumer of `PAYLOAD_APP_CONFIG_API_KEY` and point it at the CMS.
- [ ] **Keycloak's domain check:** `/api/keycloak/domain-check` answers on both
      components, so its URL can stay as it is.

## Rollout: development

### 1. Push the images

Actions → **Development Deploy** → Run workflow → branch `development`, tick
**images_only**. Wait for all four images.

### 2. Add `norse-cms` to both dev apps

Add the component, its variables, its domain and its routing rule. Public traffic
still goes to `norse-search`. On start it runs `payload migrate`.

**Check each CMS** (`<base>` is empty for multi-tenant, `/adresources` for MBOA, and
MBOA URLs end in `/`):

- `https://<cms domain><base>/` redirects to the admin, and you can sign in.
- `https://<cms domain><base>/en` is a 404.
- `https://<cms domain><base>/api/healthz` reports Postgres and Redis `ok`.

### 3. Add `norse-app` to both dev apps

Add the component and its variables. Give it no routing rule yet; if the dashboard
requires one, use an unused path such as `/norse-app-test`.

**Check the private connection** from `norse-app`'s Console tab. It returns the
tenant, and `401` without the header:

```bash
node -e "fetch(process.env.PAYLOAD_CMS_URL + '/api/internal/tenants/by-host?host=<tenant host>', { headers: { 'x-internal-api-key': process.env.PAYLOAD_API_ROUTE_SECRET } }).then(async (r) => console.log(r.status, (await r.text()).slice(0, 80)))"
```

On MBOA use `/api/internal/tenants/by-host/?host=<tenant host>`.

### 4. Flip the traffic

In Networking, point the rule that matches all domains at `norse-app` instead of
`norse-search`.

**Check:**

- `norse-app`'s logs show no `cms_request_failed` or
  `tenant_basic_config_fetch_failed`.
- Pages load with the right branding and locales on several tenants, and search
  works. For MBOA, check `https://stg-mboa.c211.io/adresources/`, including a second
  language and a detail page.
- Sign-in works on a tenant with accounts, a login-wall tenant still requires login,
  and MBOA sign-in works.
- `<tenant host>/admin` and `/api/users/me` are 404.
- `/api/healthz` on a tenant host reports Postgres `disabled`.

### 5. Check what needs the CMS

These have never run against a real split deployment, so test each of them:

- Printable directories: auto-translation on save, cover or logo upload, "Send to
  me now". The last one checks PDF rendering through `INTERNAL_APP_URL`.
- A scheduled PDF delivery.
- An admin edit (tenant branding, say) reaches the public site within a minute.
- A password-reset email links to the CMS domain.
- Translation jobs, and the admin's Analytics and Scorecards pages.

### 6. Run the real pipeline

Run **Development Deploy** on `development`, without `images_only`. It should deploy
the CMS images, then the public images, then pass e2e. If it times out waiting,
check that autodeploy is on for both components.

## Rollout: production

Do this only after development has run cleanly for a few days.

### 7. Push the production images

Merge to `main` as usual, **without a tag yet**. Then Actions → **Production Deploy**
→ Run workflow on `main`, with **images_only** ticked (it is the default).

### 8. Add the components

Steps 2 and 3 on both production apps. From this moment `norse-cms` runs Payload
jobs and migrations against production too. `norse-search` runs the same jobs until
you remove it; Payload locks queued jobs, as it already does across instances.

### 9. Flip the traffic

In a low-traffic window, MBOA first because it is a single tenant, then
multi-tenant. Same flip and checks as step 4, with `https://mn.gov/adresources/` for
MBOA. E2E does not run on production, so do the checks by hand, including those in
step 5 that don't send email to real recipients.

Requests through the mn.gov proxy are the one path development can't rehearse, so
check them specifically.

### 10. Finish

- Tell admins the new URLs: `https://cms.c211.io/admin` and
  `https://mboa-cms.c211.io/adresources/admin/`. They must sign in again, and the
  tenant is no longer preselected from the host, so tenant admins may need to pick
  theirs.
- The next `v*` tag runs the full pipeline. Watch that first run.
- After a few days without problems, remove `norse-search` from each app, and later
  the old `norse` repository.

Remove `norse-search` soon rather than keeping it indefinitely: it restarts with
every deployment of the app, runs `payload migrate` from its old image each time,
and keeps running jobs with old code.

## Rollback

| Situation                     | What to do                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `norse-cms` misbehaves        | Nothing public depends on it before the flip. Fix or remove the component.         |
| Problems after the flip       | Point the all-domains rule back at `norse-search`. Takes one deployment.           |
| After removing `norse-search` | Restore the app spec you downloaded, or re-add the component from its last image.  |

`norse-search` runs the code from before the split, and it reads
`PAYLOAD_API_ROUTE_SECRET` itself, so its own variables keep working.

Check the migrations before relying on this: the split added none, but a later
release may. Going back to `norse-search` is only safe while its code still works
with the current schema, so treat rollback as available until the first
non-additive migration after the split.

## Logs to watch

| Event                              | App    | Meaning                                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `cms_request_failed`               | public | A call to the CMS failed. See `status`, `body`, and `cfRay` (set means it went through Cloudflare). |
| `tenant_basic_config_fetch_failed` | public | The proxy could not read a tenant's locales and login wall, so the page got defaults, **without its login wall**. |
| `CMS internal API route failed`    | CMS    | An `/api/internal/*` handler threw and answered 500.                                         |

The secret is never logged in full: `tenant_basic_config_fetch_failed` shows its
first and last 4 characters (`secret`), enough to spot a mismatch within a pair.
