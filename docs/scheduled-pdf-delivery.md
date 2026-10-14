# Scheduled PDF Delivery

## Purpose

Users with the `scheduledPdfDelivery` printable directory capability can have
a directory's PDF emailed automatically on chosen days, for example:

| Need                    | Stored as                                |
| ----------------------- | ---------------------------------------- |
| every Monday            | `weekly`, `weekdays: [1]`                |
| every Mon, Wed, Fri     | `weekly`, `weekdays: [1, 3, 5]`          |
| every Mon–Sat           | `weekly`, `weekdays: [1, 2, 3, 4, 5, 6]` |
| every 15th of the month | `monthly`, `monthDays: [15]`             |
| every 1st and 16th      | `monthly`, `monthDays: [1, 16]`          |

Each schedule ("delivery") also fixes the PDF variant (language, template,
font size, booklet) and up to 100 recipient emails. A directory can have up to
100 deliveries.

## Where it's configured

- **Capability**: Payload → Resource Directories → Printable Directories →
  User Groups → "Scheduled PDF Delivery" (`scheduledPdfDelivery`). The tenant
  also needs `featureFlags.enablePrintableDirectories`. See
  [printable-directories.md](./printable-directories.md#access-control).
- **Schedules**: the "Scheduled delivery" card on a directory's detail page,
  for users with the capability and edit access to the directory (owner or
  `shared-edit`).
- **Email**: `SENDGRID_API_KEY` enables Payload's SendGrid adapter. Without
  it, Payload writes emails to the console; in production the job then skips
  the run instead.
- **Server-to-server**: `INTERNAL_API_KEY` (Norse API internal endpoints and
  the internal render route), `API_URL`. `INTERNAL_APP_URL` optionally
  overrides the loopback origin used to reach the render route (default
  `http://127.0.0.1:$PORT`).

## Rules

| Topic       | Behavior                                                                                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timing      | Days only, no time of day. Every tenant's deliveries go out around **03:00 America/New_York** (DST-aware). Month days are 1–28, so every month gets every selected day.            |
| Limits      | 100 deliveries per directory, 100 recipients per delivery; enforced by the Norse API and mirrored in the UI.                                                                       |
| Permissions | Capability checked by Norse on every action; directory edit access by the API. The job re-checks the **creator's** capability and skips (`capability_revoked`) when it's gone. |
| Transport   | PDF attached when ≤ 20 MB, otherwise the public share link (same variant/font size/booklet). Creator in To and Reply-To, recipients in BCC. No unsubscribe link.                 |
| Failures    | Recorded on the delivery and emailed to the creator with the reason and a link to the directory.                                                                                  |
| Test        | "Send to me now" renders a saved delivery and emails it only to the signed-in user; it doesn't affect the schedule or its last run.                                               |
| Language    | If the delivery's language was removed from the directory, it's sent in the primary language and the card shows a warning.                                                        |

## Architecture

### Norse API (NestJS + MongoDB)

Deliveries live in the `printableDirectoryDeliveries` collection, one document
per schedule, deleted together with their directory. `createdByEmail` comes
from the token's `email` claim. See the API repo's
`docs/printable-directories.md` ("Scheduled PDF Deliveries") for endpoints:

- user (Keycloak, edit access): `GET|POST /printable-directories/:id/deliveries`,
  `PATCH|DELETE /printable-directories/:id/deliveries/:deliveryId`;
- internal (`x-internal-api-key` + `x-tenant-id`), for the job:
  `GET …/due?date=`, `POST …/:id/claim`, `POST …/:id/result`,
  `GET …/:id/preview` under `/internal/printable-directory-deliveries`.

`claim` is atomic per calendar date, so a delivery is sent at most once a day
however often the job runs.

### Daily job (Payload task)

`deliverScheduledPdfs` (`src/payload/jobs/deliverScheduledPdfs.ts`), queue
`pdfDelivery`. Payload's scheduler has no time zone setting and the server
runs in UTC, so it's scheduled hourly and only works when it's 03:00 in New
York (`deliveryClock.ts`). Queue it with `{ date: 'YYYY-MM-DD', force: true }`
to run or re-run a day by hand.

`runScheduledPdfDeliveries` (`shared/services/scheduled-pdf-delivery/`)
processes everything **sequentially**:

1. Resource directories with printable directories enabled → each tenant's
   first trusted domain → app config (`getAppConfigForHost`).
2. Skip tenants where no user group grants `scheduledPdfDelivery`.
3. For each due delivery: claim → re-check the creator's capability →
   preview (as the directory owner) → render → email → record the result;
   on failure, email the creator.

### Rendering on the server

The PDF is the same React-PDF document as the browser print dialog. App
Router code (pages, route handlers, server actions, instrumentation, and
everything the Payload config reaches) is compiled for React Server
Components, where the PDF templates' context and hooks don't exist. So
rendering happens in a **Pages Router API route**,
`src/pages/api/internal/printable-directory-pdf.ts`, which server code calls
over loopback with `x-internal-api-key` (`requestPrintableDirectoryPdf`).
Don't import `render-printable-directory-pdf.tsx` from anywhere else.

Because a `pages/` directory exists, Next types `useSearchParams()` and
`usePathname()` as nullable app-wide; handle `null` at call sites.

- Fonts load from `public/fonts` on disk on the server (`pdf-fonts.tsx`); the
  standalone image ships `public/`.
- Booklet padding runs on bytes (`applyBookletPaddingToBytes`).
- Relative media URLs are made absolute against the tenant's origin.
- Rendering runs in the web server process. It's CPU-bound; 03:00 ET is low
  traffic and work is sequential, but move it to a worker if it shows up in
  latency.

### UI and server actions

- `ScheduledDeliveriesCard` / `ScheduledDeliveryDialog`
  (`features/printable-directories/components/detail/`): weekly (7 day
  toggles) or monthly (1–28 grid) with presets, the shared print format
  options, and a recipients box that accepts pasted lists.
- Validation shared by the dialog and server actions:
  `features/printable-directories/utils/scheduledDelivery.ts` (zod).
- Server actions in `shared/serverActions/printableDirectories/`:
  `get|create|update|deletePrintableDirectoryDelivery(ies)` and
  `sendPrintableDirectoryDeliveryTest`, all gated by
  `getScheduledDeliveryAccess()`.
- Email copy is in `page-directories` (`scheduled_delivery_email_*`,
  `scheduled_delivery_failure_*`, `scheduled_delivery_reason_*`), in the
  delivery's language with the tenant's default as fallback.
