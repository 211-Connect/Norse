# Tracing

OpenTelemetry distributed tracing for the Next.js app (`norse-app`), wired
so a single trace can span both `norse-app` and the Norse API (`norse-api`,
a separate NestJS repo).

## What's instrumented

- **Incoming requests**: Next.js's built-in request/render spans (root span
  per request, RSC render spans, route handler spans, etc.) — these come for
  free once an OTel SDK is registered, no extra code required.
- **Outgoing calls to the Norse API**: every call made through the generated
  SDK (`src/lib/api/clients.ts`) goes through the global `fetch`. `@vercel/otel`'s
  fetch instrumentation patches that global `fetch`, creates a client span for
  each call, and — scoped via `propagateContextUrls` — injects a `traceparent`
  header **only** for requests whose URL starts with `API_URL`. Calls to
  Keycloak, S3, Umami, Mapbox, Azure/Google Translate, etc. are traced (a
  span still shows up locally) but do **not** get a `traceparent` header,
  since those services don't consume/expect one.

The Norse API's `main.ts` already documents `traceparent` as an accepted
global Swagger header, so no API-side change was needed for it to receive
and link the propagated context.

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

**`norse-api`'s `tracing.ts` should use the same pattern** so the two
services can run independent (even different) sampling ratios without ever
producing partial traces:

```ts
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

sampler: new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(
    parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0'),
  ),
}),
```

As of this writing, the API's `tracing.ts` still uses a raw
`TraceIdRatioBasedSampler` (no `ParentBasedSampler`) — until it's updated,
**keep `OTEL_TRACES_SAMPLER_ARG` identical on both services** to avoid
partial traces. `norse-app` is almost always the trace root (browser →
norse-app → norse-api), so in practice `norse-app`'s ratio is what
determines whether a given user request is traced at all; `norse-api`'s
ratio only matters on its own for requests that reach it directly without
going through `norse-app` (if any exist).

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

Once `norse-api` adopts `ParentBasedSampler`, its own ratio stops mattering
for the normal browser → app → api path (it just inherits `norse-app`'s
decision) and only applies to traffic that hits `norse-api` directly. At
that point the two services no longer need to match, but keeping them equal
remains the simplest default unless there's a specific reason to give
direct-hit traffic different visibility.

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
- DB/Redis-level spans (e.g. `@opentelemetry/instrumentation-pg`/`ioredis`)
  — only HTTP-level request/response tracing exists today.
- Tempo `metrics_generator` / service-graph wiring into the existing local
  Prometheus — would need `--web.enable-remote-write-receiver` on the
  `prometheus` service; not required to see propagated traces.
