# Release plan: CMS / public app split (DevOps)

How to roll out the split of Norse into two DigitalOcean apps: the
**public app** (no database) and the **Payload CMS**. What the split is and
how the code works: [cms-app-separation-plan.md](/docs/cms-app-separation-plan.md).

Every step below keeps production working and can be rolled back on its own.
Steps 1–3 change nothing users can see.

## What changes for operations

|                 | Today (`norse`)                      | After the split                                                                 |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Images          | one: `norse`                         | `norse-app` (public), `norse-cms` (CMS), plus `norse` (unchanged, both in one)  |
| DO apps         | multi-tenant app, MBOA app           | multi-tenant **public** app, new **CMS** app, MBOA app (unchanged)              |
| Database access | the app                              | the CMS only                                                                    |
| Migrations      | the app on start                     | the CMS on start                                                                |
| Payload jobs    | the app                              | the CMS                                                                         |
| Admin URL       | `https://<tenant host>/admin`        | `https://cms.<domain>/admin`                                                    |

**MBOA stays on the combined `norse` image** (`NORSE_ROLE` unset) in this
release. It has its own deployment and base path (`/adresources`); split it
later with the same steps once the multi-tenant split has run for a while.

## The images

One Dockerfile, three targets. Build args are the same as today
(`NEXT_PUBLIC_*`).

| Target    | Command                         | Contents                                                                                           | Start command                         |
| --------- | ------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `app`     | `docker build --target app .`   | Next.js standalone server only. No Payload admin/REST/migrations, no Postgres client in use.       | `node server.js`                      |
| `cms`     | `docker build --target cms .`   | Payload admin, REST, CMS internal API, jobs, PDF rendering; `node_modules` + `src` for migrations. | `npx payload migrate && node server.js` |
| (default) | `docker build .`                | Both, as today. `NORSE_ROLE` picks the role at runtime.                                            | migrate unless `NORSE_ROLE=app`, then serve |

The role is baked into `app` and `cms` images (`NORSE_BUILD`). Setting a
different `NORSE_ROLE` on them makes the server refuse to start, so an image
cannot run as the wrong half by accident.

### CI change (GitHub Actions)

In `development-deploy.yaml` and `production-deploy.yaml`, keep the current
`norse` build (MBOA and rollback) and add two builds of the same commit, with
the same `build-args`, tags and cache settings, differing only in `target`
and image name:

```yaml
      - name: Build and push public app image
        uses: docker/build-push-action@v7
        with:
          context: .
          file: ./Dockerfile
          target: app
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ secrets.DO_REGISTRY_NAME }}/norse-app:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ secrets.DO_REGISTRY_NAME }}/norse-app:production   # development: :development
          build-args: |
            # same NEXT_PUBLIC_* args as the norse build
          cache-from: type=local,src=${{ runner.temp }}/.buildx-cache
          cache-to: type=local,dest=${{ runner.temp }}/.buildx-cache-new,mode=max

      - name: Build and push CMS image
        uses: docker/build-push-action@v7
        with:
          context: .
          file: ./Dockerfile
          target: cms
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ secrets.DO_REGISTRY_NAME }}/norse-cms:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ secrets.DO_REGISTRY_NAME }}/norse-cms:production   # development: :development
          build-args: |
            # same NEXT_PUBLIC_* args as the norse build
          cache-from: type=local,src=${{ runner.temp }}/.buildx-cache
          cache-to: type=local,dest=${{ runner.temp }}/.buildx-cache-new,mode=max
```

The three builds share the dependency layer; each runs its own `next build`.
Add `wait-for-deploy` jobs for the new CMS app like the existing ones. Push
the CMS image before (or together with) the public app image: the public app
needs the CMS endpoints of the same release.

## Networking and DNS

The public app calls the CMS on every cache miss (tenant lookups, app
config). That traffic **must not go through the Cloudflare WAF**: a WAF
`403` on a server-to-server call is what started this work.

| Hostname                  | Points at                                | Cloudflare               | Used by                                              |
| ------------------------- | ---------------------------------------- | ------------------------ | ---------------------------------------------------- |
| `cms.<domain>`            | the CMS app                              | proxied (orange)         | admins in a browser (`/admin`)                       |
| `cms-internal.<domain>`   | the CMS app                              | **DNS only (grey)**      | the public app (`PAYLOAD_CMS_URL`), the CMS itself (`INTERNAL_APP_URL`) |
| tenant hosts              | the public app                           | as today                 | everyone                                             |

Add both CMS hostnames as domains of the CMS app in DigitalOcean. If a
DNS-only record is not acceptable, add a Cloudflare WAF skip rule for paths
`/api/internal/*` and `/api/getTenantBasicConfig` on `cms-internal.<domain>`
instead.

## Environment variables

`PAYLOAD_API_ROUTE_SECRET` is the shared secret between the two apps (header
`x-internal-api-key`). **Generate a new value**: the current one appeared in
plain text in production logs.

```bash
openssl rand -base64 32
```

| Variable                                                                 | Public app       | CMS              | Notes                                                                      |
| ------------------------------------------------------------------------ | ---------------- | ---------------- | -------------------------------------------------------------------------- |
| `PAYLOAD_API_ROUTE_SECRET`                                               | ✓ (same value)   | ✓ (same value)   | new value                                                                  |
| `PAYLOAD_CMS_URL`                                                        | `https://cms-internal.<domain>` | — | required; the app refuses CMS calls without it                     |
| `DATABASE_URI`, `DATABASE_POOL_MIN/MAX`                                  | —                | ✓                |                                                                            |
| `PAYLOAD_SECRET`                                                         | —                | ✓                |                                                                            |
| `MEDIA_S3_*`, `MEDIA_DO_CDN_ENDPOINT`                                    | —                | ✓                |                                                                            |
| `SENDGRID_API_KEY`                                                       | —                | ✓                |                                                                            |
| `KEYCLOAK_ADMIN_SECRET` (and other Keycloak admin vars)                  | —                | ✓                |                                                                            |
| `GOOGLE_TRANSLATE_CREDENTIALS_BASE64`, `AZURE_TRANSLATOR_*`              | —                | ✓                | translation runs in the CMS                                                |
| `CUSTOM_AUTH_HOST`                                                       | —                | `cms.<domain>`   | password-reset links                                                       |
| `INTERNAL_APP_URL`                                                       | —                | `https://cms-internal.<domain>` | PDF rendering for scheduled delivery (loopback does not work on App Platform) |
| `PAYLOAD_APP_CONFIG_API_KEY`                                             | —                | ✓                | external `/api/tenants/<id>/config` consumers now call the CMS host       |
| `CACHE_REDIS_URI`                                                        | ✓ (same Redis)   | ✓ (same Redis)   | the CMS deletes cache keys the app reads                                   |
| `API_URL`, `INTERNAL_API_KEY`                                            | ✓                | ✓                | Norse API                                                                  |
| `KEYCLOAK_INTERNAL_SECRET`                                               | ✓                | ✓                | `/api/keycloak/domain-check` answers on both                               |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, Keycloak client vars                  | ✓                | —                |                                                                            |
| `ARCJET_*`, Umami, map styles, Twilio/EMS, `WEBHOOK_ALERT_URL`, `EMS_SERVICE_URL` | ✓        | —                |                                                                            |
| `PROMETHEUS_TOKEN`, `OTEL_*`, `NEXT_PUBLIC_LOG_LEVEL`                    | ✓                | ✓                |                                                                            |
| `NORSE_ROLE`                                                             | not needed       | not needed       | baked into the `app`/`cms` images; only the combined image reads it       |

Both apps: port `3000`, health check `GET /api/health` (liveness) — or
`/api/healthz` (the CMS's includes Postgres and Redis; the app's only Redis).

## Rollout

### 1. Rotate the secret (existing app, no downtime)

Set the new `PAYLOAD_API_ROUTE_SECRET` on the multi-tenant and MBOA apps and
redeploy them.

- **Check:** no `tenant_basic_config_fetch_failed` with `status: 401` in the
  logs; Spanish (or another non-default locale) pages still load.
- **Rollback:** restore the previous value.

### 2. Ship the release with the new images (no behaviour change)

Merge the release and let CI push `norse`, `norse-app` and `norse-cms`. The
existing apps keep pulling `norse`, which behaves as before.

### 3. Create the CMS app

New DigitalOcean app from `norse-cms:<env>`, same region and VPC as the
database, with the CMS column above and both CMS hostnames. Start with the
same instance size as the current app, one instance.

- On start it runs `payload migrate`. The current app also migrates on start
  until step 5; both run the same migrations from the same release, so this
  is safe, but avoid deploying the two apps at the exact same moment.
- Payload jobs (translation, cache warm-up, scheduled PDF delivery) now run in
  both the CMS and the current app until step 5. Payload locks queued jobs,
  as it already does across instances.
- **Check:**
  - `https://cms.<domain>/admin` logs in; `https://cms.<domain>/` redirects to
    `/admin`; a public page on the CMS host (e.g. `/en`) is a 404.
  - `curl -H "x-internal-api-key: $SECRET" "https://cms-internal.<domain>/api/internal/tenants/by-host?host=<a tenant host>"`
    returns the tenant JSON; without the header it is `401`.
  - `/api/healthz` reports Postgres and Redis `ok`.
- **Rollback:** delete the CMS app. Nothing depends on it yet.

### 4. Point the current app at the CMS (still with its database)

On the multi-tenant app (still the combined `norse` image) set
`PAYLOAD_CMS_URL=https://cms-internal.<domain>`. It now reads every CMS value
over HTTP, but keeps its database and admin as a safety net.

- **Check for a day or two:**
  - Logs: no `cms_request_failed`, no `tenant_basic_config_fetch_failed`.
  - Pages load with the right branding and locales on several tenants;
    search works; login-wall tenants still require login.
  - Page latency: the first request per tenant after a cache expiry adds one
    call to the CMS (values are cached in memory and Redis).
  - Printable directories (users with the capability): auto-translation on
    save, image upload, "Send to me now".
- **Rollback:** remove `PAYLOAD_CMS_URL`.

### 5. Switch the public app to the `norse-app` image (cut the cord)

Change the multi-tenant app's image to `norse-app:<env>` and remove from it
everything in the "—" rows of the public app column: `DATABASE_URI`,
`DATABASE_POOL_*`, `PAYLOAD_SECRET`, `MEDIA_S3_*`, `SENDGRID_API_KEY`,
Keycloak admin vars, translation credentials, `CUSTOM_AUTH_HOST`,
`INTERNAL_APP_URL`, `PAYLOAD_APP_CONFIG_API_KEY`. Remove `NORSE_ROLE` if set.

- From now on `/admin` on tenant hosts is a 404, and only the CMS migrates
  and runs jobs.
- Restrict the database's trusted sources to the CMS app.
- **Check:** as in step 4, plus:
  - Logs: no `payload_used_in_app_role` (a missed database path; the request
    fails with a 500).
  - `https://<tenant host>/admin` and `/api/users/me` are `404`.
  - `/api/healthz` reports Postgres `disabled`.
- **Rollback:** switch the image back to `norse:<env>` and restore the
  database variables (keep them in a note until the split has run a week).

### 6. Tell the admins

Admins sign in at `https://cms.<domain>/admin` from now on. Update
bookmarks, Keycloak/Umami links and internal docs. Consumers of
`/api/tenants/<id>/config` (Bearer `PAYLOAD_APP_CONFIG_API_KEY`) must call
`https://cms.<domain>` (or `cms-internal`).

### 7. Clean up (after a week)

- Remove the database variables you kept for rollback.
- Decide when to split MBOA the same way (its own CMS or the shared one).

## Logs to watch

| Event                                | App      | Meaning                                                                                 |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------------- |
| `cms_request_failed`                 | public   | a call to the CMS failed: `status`, `cfRay` (set means it went through Cloudflare), `body` |
| `tenant_basic_config_fetch_failed`   | public   | the proxy could not read a tenant's locales/login wall; the page is served with defaults |
| `payload_used_in_app_role`           | public   | a code path still needs the database; the request failed                                |
| `CMS internal API route failed`      | CMS      | an `/api/internal/*` handler threw (500)                                                |

The secret is never logged in full: `tenant_basic_config_fetch_failed` shows
the first and last 4 characters (`secret` field), enough to spot a mismatch
between the apps.
