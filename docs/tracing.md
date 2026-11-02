# Tracing

OpenTelemetry distributed tracing for the Next.js app (`norse-app`), wired
so a single trace can span both `norse-app` and the Norse API (`norse-api`,
a separate NestJS repo).

## What's instrumented

- **Incoming requests**: Next.js's built-in request/render spans (root span
  per request, RSC render spans, route handler spans, etc.) — these come for
  free once an OTel SDK is registered, no extra code required.
- **Redis commands**: `@opentelemetry/instrumentation-ioredis`, registered in
  `src/instrumentation.ts` next to `'auto'`, creates a client span per
  command (`get`, `setex`, ...; `db.system = redis`) under the request that
  ran it, with an error status on a timeout. `db.statement` keeps the
  command and key only; values are masked (`[2 other arguments]`). It
  patches `ioredis` when `require()` loads it, so `ioredis` is in
  `serverExternalPackages` (`next.config.js`): a copy bundled into
  `.next/server/chunks` is never patched and traces nothing.
  `requireParentSpan` drops commands that run outside a request.
- **Outgoing calls to the Norse API**: every call made through the generated
  SDK (`src/lib/api/clients.ts`) goes through the global `fetch`. `@vercel/otel`'s
  fetch instrumentation patches that global `fetch`, creates a client span for
  each call, and — scoped via `propagateContextUrls` — injects a `traceparent`
  header **only** for requests whose URL starts with `API_URL`. Calls to
  Keycloak, S3, Umami, Mapbox, Azure/Google Translate, etc. are traced (a
  span still shows up locally) but do **not** get a `traceparent` header,
  since those services don't consume/expect one.

  The scope is read from `API_URL` at startup; if it's unset, a warning is
  logged and no `traceparent` reaches the API. Don't rely on `@vercel/otel`'s
  defaults instead: without `propagateContextUrls` it only propagates to
  `http://localhost` URLs (or the deployment's own host on Vercel), so local
  dev would look fine while staging/prod traces silently stop at `norse-app`.

- **Arcjet decisions**: the Arcjet SDK calls its API over a `node:http2`
  Connect RPC session (`@arcjet/transport` → `@connectrpc/connect-node`),
  not the global `fetch`, so the fetch instrumentation above never sees it.
  `src/lib/arcjet-page.ts` wraps each decision in a manual `arcjet.protect`
  span (attributes `url.path`, `arcjet.enforced`, `arcjet.conclusion`, and
  `arcjet.reason_type` on a denial). On observe-only hosts the decision runs
  in `after()`, so its span ends after the request's root span. No
  `traceparent` is sent to Arcjet.

- **Scheduled jobs**: each Payload job run gets a root span `job <slug>`
  (`src/payload/jobs/tracedTask.ts`), and its fetch and Redis spans sit under
  it.

The Norse API's `main.ts` already documents `traceparent` as an accepted
global Swagger header, so no API-side change was needed for it to receive
and link the propagated context.

## Trace boundaries

`norse-app` starts its own trace for every request. Two rules keep traces
whole; breaking either shows up in Grafana as `<root span not yet received>`
or as a trace lasting hours.

**Inbound `traceparent` is ignored.** Next.js extracts it from every incoming
request, so without this a header from a gateway, CDN or bot makes our root
span the child of a span that never reaches Tempo. It would also let any
caller decide whether a request is sampled. `src/instrumentation.ts` registers
`InboundIgnoringTraceContextPropagator` (`src/lib/tracing.ts`), which still
injects `traceparent` on calls to the Norse API. If something upstream ever
exports to the same Tempo, this is what to change to join its traces.

**Timers must not keep a request's context.** A timer inherits the async
context it was created in, so one armed during a request runs inside that
request's trace for as long as it keeps firing. Anything long-lived has to
leave that context when it starts:

- the blocked-traffic flush timer arms under `ROOT_CONTEXT`
  (`defaultSchedule` in `src/lib/blocked-traffic-counter.ts`), so each push is
  its own trace;
- Payload arms its `autoRun` crons inside whichever request first reaches
  `getPayload({ cron: true })`, which we don't control, so job handlers are
  wrapped with `tracedTask`. Add new tasks to the `tasks` list in
  `payload-config.ts`, which applies it.

Use `inNewTrace` from `src/lib/tracing.ts` for new background work.

### Finding the cause of a rootless trace

Open the trace and look at its topmost span:

- `norse-api` spans only: the API recorded a request whose parent never
  arrived. Either a caller sent it `traceparent` directly, or the `norse-app`
  span was lost on export. The API honors a sampled inbound `traceparent`
  (`remoteParentSampled: AlwaysOn`).
- A `norse-app` span named after the request method, with a parent span ID:
  an inbound `traceparent`, from a build older than the propagator above.
- `fetch POST .../blocked-traffic...` or spans from a job, in a trace older
  than the search window: a timer that kept a request's context. The root
  exists but falls outside the range Grafana searched, so widen the range.
- A mix, only under load: `BatchSpanProcessor` drops spans once its 2048-span
  queue is full, without logging at the default level. Raise
  `OTEL_BSP_MAX_QUEUE_SIZE` or lower the sampling ratio.

## Why `@vercel/otel`, not a manual `NodeSDK`

Next.js's own built-in fetch span (the one you can disable with
`NEXT_OTEL_FETCH_DISABLED`) only **creates a span** — it does not inject a
`traceparent` header into the outgoing request (verified directly against
`next`'s source: the only place it calls `propagation.inject` is to embed
trace metadata into the HTML response for client-side hydration tracing,
unrelated to server-side outgoing HTTP calls). So registering an OTel SDK by
itself is not enough for propagation to the Norse API — something has to
actually instrument outgoing HTTP calls.

`@vercel/otel` bundles a fetch instrumentation that does real HTTP-level
context propagation, scoped precisely to the URLs we choose
(`propagateContextUrls`). This keeps propagation intentional (Norse API
only) instead of stamping every outbound call — including third-party
services that don't need it — the way a blanket
`getNodeAutoInstrumentations()` (the pattern the NestJS API's `tracing.ts`
uses) would.

Because both Next's built-in fetch span and `@vercel/otel`'s fetch
instrumentation patch the same global `fetch`, `src/instrumentation.ts` sets
`process.env.NEXT_OTEL_FETCH_DISABLED = '1'` at startup so only
`@vercel/otel`'s instrumentation (the one that actually propagates) traces
outgoing fetches — otherwise every outgoing call would get two overlapping,
differently-behaved spans.

## Configuration

- `src/instrumentation.ts` — the single entry point. Sets the service name
  (`norse-app`, paired with the API's `norse-api`), the trace sampler, and
  the fetch propagation scope.
- `OTEL_TRACES_SAMPLER_ARG` — ratio (0.0–1.0) passed to
  `TraceIdRatioBasedSampler`, same env var name the API's `tracing.ts` uses.
  Defaults to `1.0` (sample everything) if unset.
- `OTEL_EXPORTER_OTLP_ENDPOINT` — where spans are exported. `compose.yaml`
  points this at the local `tempo` service (`http://tempo:4318`) for
  `norse-app`. For a non-dockerized `npm run dev`, set it in `.env` to
  `http://localhost:4318` (Tempo's OTLP HTTP port is published to the host).
  In any other environment (staging/prod), point it at whatever OTLP
  collector Ops has configured — same as the API.

No `next.config.js` or `Dockerfile` changes were needed: `instrumentation.ts`
is a stable Next.js convention (no experimental flag), and Next's
`output: 'standalone'` build already bundles it into the standalone server
output automatically.

## Sampling: coordinating `OTEL_TRACES_SAMPLER_ARG` across norse-app and norse-api

`TraceIdRatioBasedSampler` is a **pure, deterministic function of
`(traceId, ratio)`** — it XOR-folds the trace ID's bits and compares against
a ratio-derived threshold, with no randomness and no service-specific salt
(verified against the installed OTel SDK source,
`@opentelemetry/sdk-trace/build/src/sampler/TraceIdRatioBasedSampler.js`).
Given the same trace ID and the same ratio, any service computes the exact
same decision.

That's *why* running two services at the same ratio "works", but relying on
that alone is fragile: if `norse-app` and `norse-api` ever run **different**
ratios, you get broken traces — because the "sampled" set at the lower ratio
is a strict subset of the "sampled" set at the higher ratio (same hash,
different cutoff):

- If `norse-api`'s ratio is higher than `norse-app`'s: `norse-api` records
  orphan spans for traces `norse-app` already decided not to sample (and
  therefore never exported) — Tempo shows API-only spans with a parent span
  ID that doesn't exist.
- If `norse-api`'s ratio is lower: the reverse — `norse-app` fully records
  its side (including the client "fetch" span for the API call), but the
  corresponding API-side spans are silently dropped.

To make this robust instead of "must keep two env vars in sync forever",
`src/instrumentation.ts` wraps the ratio sampler in `ParentBasedSampler`:

```ts
traceSampler: new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(ratio),
}),
```

`ParentBasedSampler` (confirmed by reading its source,
`@opentelemetry/sdk-trace/build/src/sampler/ParentBasedSampler.js`): if this
span already has a parent context with a sampled/unsampled decision — i.e.
it arrived via a propagated `traceparent` — it **respects that decision**
instead of re-deciding independently. The ratio sampler (`root`) is only
consulted when there's **no** parent, i.e. this request is the trace root.

`norse-api`'s `tracing.ts` uses the same pattern, so the two services can run
different ratios without producing partial traces. `norse-app` is almost
always the trace root (browser → norse-app → norse-api), so its ratio decides
whether a user request is traced at all; `norse-api`'s ratio only matters for
requests that reach it directly. `@vercel/otel` sends no `traceparent` for a
trace `norse-app` did not sample, so the API makes its own decision there.

### What value to use

There's no universally correct number — it depends on request volume and
what the OTLP backend costs to store — but as a starting point:

- **Local dev / staging**: `1.0` (100%, the default when unset). Traffic is
  low and full visibility is worth it while iterating.
- **Production**: start at `0.1` (10%) on **both** services. It's cheap
  enough to run continuously while still being likely to catch real
  user-facing issues in a sampled trace within minutes, without paying to
  store every single request forever. Adjust from there based on actual
  traffic and observed collector cost/volume:
  - Sustained high traffic (hundreds of req/s or more): drop to `0.01`–`0.05`.
  - Light/moderate traffic: `0.1`–`0.2` is likely still affordable and gives
    better debugging signal.

Keeping the two ratios equal remains the simplest default unless there's a
specific reason to give direct-hit traffic different visibility.

## Viewing traces locally

`compose.yaml` runs a local Grafana Tempo (`tempo`, config in
[`tempo.yaml`](/tempo.yaml)) and provisions it as a Grafana datasource
(`grafana/provisioning/datasources/tempo.yml`) — no manual Grafana setup
needed.

1. `docker compose up` (or your usual local stack).
2. Exercise a code path that calls the Norse API (e.g. load the search page).
3. Open Grafana (`http://localhost:3001`, `admin`/`admin`) → **Explore** →
   select the **Tempo** datasource → search `{ resource.service.name = "norse-app" }`.
4. You should see a trace with a root span for the request and a child
   "fetch" span for the Norse API call, carrying the propagated `traceparent`.

Seeing the **full** cross-service trace (norse-app → norse-api) locally
requires the API's own local `tracing.ts` to export to this same Tempo
instance — point its OTLP gRPC exporter at the published `4317` port
(e.g. `http://localhost:4317` from the API's host, or the docker network
hostname if both repos share a compose network). That's a `norse-api`-repo
configuration change, out of scope here.

## Out of scope / possible future work

- `onRequestError` instrumentation hook for error reporting — not wired up;
  can be added alongside `register()` in the same `instrumentation.ts`.
- Postgres spans (e.g. `@opentelemetry/instrumentation-pg`). Redis is
  traced (see above); Postgres queries are not.
- Tempo `metrics_generator` / service-graph wiring into the existing local
  Prometheus — would need `--web.enable-remote-write-receiver` on the
  `prometheus` service; not required to see propagated traces.
