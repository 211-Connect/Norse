# Release plan: CMS / public app split

How to roll out the split of Norse into public apps (no database) and Payload
CMS apps, for the multi-tenant deployment and MBOA at the same time. All
DigitalOcean changes are made by hand in the dashboard. What the split is and
how the code works: [cms-app-separation-plan.md](/docs/cms-app-separation-plan.md).

Development goes first and is the rehearsal for production. Public apps keep
serving their current image until the new one is active, so no step should
cause downtime.

## What you end up with

| Environment | App                   | Status   | Image (auto-deploy tag)                  | App id secret (GitHub)           |
| ----------- | --------------------- | -------- | ---------------------------------------- | -------------------------------- |
| development | multi-tenant public   | existing | `norse-app:development`                  | `DO_MULTITENANT_DEV_APP_ID`      |
| development | multi-tenant CMS      | **new**  | `norse-cms:development`                  | `DO_MULTITENANT_CMS_DEV_APP_ID`  |
| development | MBOA public           | existing | `norse-app-mboa:development`             | `DO_MBOA_DEV_APP_ID`             |
| development | MBOA CMS              | **new**  | `norse-cms-mboa:development`             | `DO_MBOA_CMS_DEV_APP_ID`         |
| production  | multi-tenant public   | existing | `norse-app:production`                   | `DO_MULTITENANT_PROD_APP_ID`     |
| production  | multi-tenant CMS      | **new**  | `norse-cms:production`                   | `DO_MULTITENANT_CMS_PROD_APP_ID` |
| production  | MBOA public           | existing | `norse-app-mboa:production`              | `DO_MBOA_PROD_APP_ID`            |
| production  | MBOA CMS              | **new**  | `norse-cms-mboa:production`              | `DO_MBOA_CMS_PROD_APP_ID`        |

Each CMS keeps its deployment's existing database, Redis and media bucket. The
public app and CMS of a pair share one Redis, because the CMS deletes the cache
keys the public app reads.

### How CI deploys

`deploy-images.yaml` (called by the development and production deploys):

1. Builds and pushes both CMS images, then waits for both CMS apps to go active.
2. Only then builds and pushes both public images, and waits for those apps.
3. Development only: runs e2e against the dev hosts, MBOA included.

A failed CMS deploy leaves the public apps on the previous release and alerts
Slack. The `images_only` option of "Run workflow" pushes the images without
waiting, for use before the apps exist.

CI no longer builds the combined `norse` image. Existing `norse:<sha>` images
stay in the registry for rollback.

## Hostnames

The public app calls the CMS whenever a cached value has expired. **That traffic
must not go through the Cloudflare WAF**: a WAF `403` on a server-to-server call
is what started this work. So each CMS gets two hostnames, both added as domains
of the CMS app:

| Hostname (example)              | Cloudflare          | Used by                                     |
| ------------------------------- | ------------------- | ------------------------------------------- |
| `cms.c211.io`                   | proxied             | admins in a browser                         |
| `cms-internal.c211.io`          | **DNS only (grey)** | the public app, and the CMS for PDF renders |
| `mboa-cms.c211.io`              | proxied             | MBOA admins                                 |
| `mboa-cms-internal.c211.io`     | **DNS only (grey)** | MBOA public app, and its CMS for PDF renders |

Use `dev-` variants for development. The names are suggestions; the variables
below are what matter.

**MBOA URLs include the base path.** The MBOA images serve everything under
`/adresources`, with trailing slashes, so the admin is at
`https://mboa-cms.c211.io/adresources/admin/`.

## Environment variables

Generate one new secret per pair (the old value appeared in production logs):

```bash
openssl rand -base64 32
```

**Pair-specific values**

| Variable                   | App    | Multi-tenant                    | MBOA                                         |
| -------------------------- | ------ | ------------------------------- | -------------------------------------------- |
| `PAYLOAD_API_ROUTE_SECRET` | both   | new secret, same value on both  | new secret, same value on both               |
| `PAYLOAD_CMS_URL`          | public | `https://cms-internal.c211.io`  | `https://mboa-cms-internal.c211.io/adresources` |
| `CMS_ADMIN_URL`            | CMS    | `https://cms.c211.io`           | `https://mboa-cms.c211.io/adresources`       |
| `INTERNAL_APP_URL`         | CMS    | `https://cms-internal.c211.io`  | `https://mboa-cms-internal.c211.io` (no base path: the code adds it) |

Check that `INTERNAL_APP_URL` is set on the CMS: its default is loopback, which
does not work on App Platform, and scheduled PDF delivery needs it.

**Everything else** moves or stays as listed. Copy values from the current app of
that deployment.

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

This list comes from the variables each built image actually reads. If the current
app sets something not listed, it is probably unused; leave it off the new apps and
watch the logs. Build-time `NEXT_PUBLIC_*` values are set in GitHub, not on the apps.

Do not set `NORSE_ROLE`: the role is baked into the images, and a different value
makes the server refuse to start. `NEXT_PUBLIC_CUSTOM_BASE_PATH` and
`NEXT_PUBLIC_WITH_TRAILING_SLASHES` are baked in too, so they have no effect at
runtime and can be removed. `CUSTOM_AUTH_HOST`, `CUSTOM_AUTH_PROTOCOL` and
`NEXTAUTH_URL` stay on the MBOA public app as they are.

## App settings (dashboard)

For every CMS app, and when switching a public app:

| Setting          | Multi-tenant                    | MBOA                                |
| ---------------- | ------------------------------- | ----------------------------------- |
| Source           | DigitalOcean Container Registry, the repository and tag above, **autodeploy on** | same |
| Run command      | leave empty (the image defines it) | same                             |
| HTTP port        | `3000`                          | `3000`                              |
| Health check     | `/api/health`                   | `/adresources/api/health/`          |
| HTTP route       | `/`                             | keep MBOA's current route on the public app; `/` on its CMS, with the path preserved |

Before editing an existing app, **download its app spec** (Settings → App Spec).
That is your rollback.

The CMS needs more memory than the public app, because it renders PDFs and runs
jobs. Start it at the size of the current app, with **one instance**, and resize
the public app down later if metrics allow.

Also add each new app to whatever watches the current ones: log forwarding,
uptime checks, alerts, the Prometheus scrape list (`/api/metrics`, with
`PROMETHEUS_TOKEN`), and the database's trusted sources.

## Before you start

- [ ] **Registry plan:** the release adds four repositories. Check your Container
      Registry plan's repository limit and storage.
- [ ] **GitHub secrets:** add the four new `DO_*_CMS_*_APP_ID` secrets once the
      apps exist (steps 2 and 7). A normal deploy fails without them.
- [ ] **MBOA's route:** the MBOA images expect requests with `/adresources` still
      in the path. Check in the MBOA public app's spec that its route preserves the
      prefix. If it strips it today, change that when you switch the image.
- [ ] **Consumers of `/api/tenants/<id>/config`:** this route moves to the CMS
      hosts. Nothing in this repo or Norse-API calls it, so find any external
      consumer of `PAYLOAD_APP_CONFIG_API_KEY` and point it at the CMS.
- [ ] **Keycloak's domain check:** `/api/keycloak/domain-check` answers on both
      apps, so its URL can stay as it is.

## Rollout: development

### 1. Push the images

Actions → **Development Deploy** → Run workflow → branch
`feat/cms-app-split`, tick **images_only**. Wait for all four images.

### 2. Create the two CMS apps

Create them with the settings and variables above and both hostnames, then add
their app ids as GitHub secrets. On start each CMS runs `payload migrate`. This
release adds no migrations.

**Check each CMS** (`<base>` is empty for multi-tenant, `/adresources` for MBOA,
and MBOA URLs end in `/`):

- `https://<cms host><base>/` redirects to the admin, and you can sign in.
- `https://<cms host><base>/en` is a 404.
- `<internal host><base>/api/healthz` reports Postgres and Redis `ok`.
- The internal API answers only with the secret:

  ```bash
  curl -H "x-internal-api-key: $SECRET" "https://cms-internal.c211.io/api/internal/tenants/by-host?host=<tenant host>"
  ```

  It returns the tenant, and `401` without the header. On MBOA the path is
  `/adresources/api/internal/tenants/by-host/?host=<tenant host>`.

### 3. Switch the public apps

For each public app, in one edit: change the source to `norse-app` or
`norse-app-mboa`, set the health check, add `PAYLOAD_CMS_URL` and the new
`PAYLOAD_API_ROUTE_SECRET`, and remove everything marked CMS-only in the table.

**Check:**

- The apps' logs show no `cms_request_failed` or
  `tenant_basic_config_fetch_failed`.
- Pages load with the right branding and locales on several tenants, and search
  works. For MBOA, check `https://stg-mboa.c211.io/adresources/`, including a
  second language and a detail page.
- Sign-in works on a tenant with accounts, a login-wall tenant still requires
  login, and MBOA sign-in works.
- `<tenant host>/admin` and `/api/users/me` are 404.
- `/api/healthz` reports Postgres `disabled`.

### 4. Check what needs the CMS

These have never run against a real split deployment, so test each of them:

- Printable directories: auto-translation on save, cover or logo upload, "Send to
  me now". The last one checks PDF rendering through `INTERNAL_APP_URL`.
- A scheduled PDF delivery.
- An admin edit (tenant branding, say) reaches the public site within a minute.
- A password-reset email links to the CMS host.
- Translation jobs, and the admin's Analytics and Scorecards pages.

### 5. Run the real pipeline

Run **Development Deploy** on the branch again, without `images_only`. It should
deploy the CMS apps, then the public apps, then pass e2e. Then merge the PR into
`development`.

## Rollout: production

Do this only after development has run cleanly for a few days.

### 6. Push the production images

Merge to `main` as usual, **without a tag yet**. Then Actions → **Production
Deploy** → Run workflow on `main`, with **images_only** ticked (it is the default).

### 7. Create the two production CMS apps

Same as step 2, and add their app id secrets. Production CMS apps run their own
Payload jobs and migrations against the production databases from this moment.
Until step 8, the old apps run the same jobs too; Payload locks queued jobs, as it
already does across instances.

### 8. Switch the production public apps

In a low-traffic window, MBOA first because it is a single tenant, then
multi-tenant. Same edit and checks as step 3, with `https://mn.gov/adresources/`
for MBOA. E2E does not run on production, so do the checks by hand, including
those in step 4 that don't send email to real recipients.

Requests through the mn.gov proxy are the one path development can't rehearse, so
check them specifically.

### 9. Finish

- Tell admins the new URLs: `https://cms.c211.io/admin` and
  `https://mboa-cms.c211.io/adresources/admin/`. They must sign in again, and the
  tenant is no longer preselected from the host, so tenant admins may need to pick
  theirs.
- Remove the public apps from the database's trusted sources.
- The next `v*` tag runs the full pipeline. Watch that first run.
- After a week, delete the saved database variables and the old `norse` repository.

## Rollback

| Situation                       | What to do                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| New CMS app misbehaves          | Nothing depends on it before step 3 or 8. Delete it or fix it.                                                   |
| Public app misbehaves after the switch | Restore the app spec you downloaded (it points at the last `norse:<tag>` image and has the database variables). Takes one deployment. |
| Rolled back and the secret changed | The old image reads `PAYLOAD_API_ROUTE_SECRET` too, and the restored spec has its old value. Update it to a new one, because the old value leaked. |

Rollback is clean because this release adds no database migrations. Once a later
release adds one, the old image may not match the schema, so treat rollback as
available only until the first migration after the split.

Rolling back a public app does not require touching its CMS. The old image doesn't
use it, and both can run against the same database.

## Logs to watch

| Event                              | App    | Meaning                                                                                      |
| ---------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `cms_request_failed`               | public | A call to the CMS failed. See `status`, `body`, and `cfRay` (set means it went through Cloudflare). |
| `tenant_basic_config_fetch_failed` | public | The proxy could not read a tenant's locales and login wall, so the page got defaults, **without its login wall**. |
| `CMS internal API route failed`    | CMS    | An `/api/internal/*` handler threw and answered 500.                                         |

The secret is never logged in full: `tenant_basic_config_fetch_failed` shows its
first and last 4 characters (`secret`), enough to spot a mismatch within a pair.
