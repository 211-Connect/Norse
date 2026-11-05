# Observability

Norse (`norse-app`) is one Node process per container on DigitalOcean App
Platform, with Payload CMS embedded in the same process, behind a CDN and a
load balancer. **Prometheus cannot scrape it.** Every signal — traces, metrics
and logs — is **pushed over OTLP** to a collector, which fans it out to Tempo,
Prometheus and Loki. Grafana reads all three.

This document covers what is emitted, how to read it, and how to run the same
pipeline locally.

## Architecture

```
norse-app (Node, one OTLP/HTTP endpoint, no path)
  traces  /v1/traces   ─┐
  metrics /v1/metrics  ─┼──► https://otlp.c211.io
  logs    /v1/logs     ─┘         │
                                  ▼
                    Envoy (TLS + basic auth)
                                  │
                                  ▼
                      Grafana Alloy (`alloy-otlp`)
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
            Tempo             Prometheus             Loki
          (traces)      (remote write, exemplars)   (logs)
              └───────────────────┼───────────────────┘
                                  ▼
                         Grafana (tempo, prometheus, loki)
```

- `OTEL_EXPORTER_OTLP_ENDPOINT` has **no path and no trailing slash**; the SDK
  appends `/v1/traces`, `/v1/metrics`, `/v1/logs`.
- Envoy terminates TLS, enforces basic auth, and forwards to Alloy. Alloy
  applies the `env` label, then exports traces → Tempo, metrics → Prometheus
  (remote write, exemplar-capable), logs → Loki.
- The Next.js **Edge** runtime only gets traces. Metrics, logs and the Node
  runtime instrumentation are Node-only and loaded via
  `import('./instrumentation.node')` from `register()` when
  `NEXT_RUNTIME === 'nodejs'`.

### URL privacy: three layers

The app does **not** avoid creating URL attributes that contain a query
string: Next.js sets `http.target = req.url` (query string included) on every
request span, `@vercel/otel` names a `fetch` span with the request URL and
writes the same URL to `http.url`, and raw `fetch` call sites (e.g.
`src/payload/utilities/keycloakAdmin.ts`) pass their query string through.
On exported spans the query string and fragment are removed in three layers
(logs take a different path — see layer 1):

1. **In-process, at span export.** Every span goes through
   `PrivacySpanExporter` (`src/lib/privacy-span-exporter.ts`): the span
   **name** and the `http.target`, `http.url`, `http.url.full`, `url.full` and
   URL-shaped `next.*` attributes are cut at the first `?` **or** `#`, and
   `url.query` is deleted. This layer protects the app even when
   `OTEL_EXPORTER_OTLP_ENDPOINT` points straight at Tempo. It only ever sees
   spans: it is the only layer that removes a bare `#fragment` from a **span**
   URL, and it removes nothing from a log record (there is no in-process log
   processor, only the OTLP `BatchLogRecordProcessor`).

   **Logs are scrubbed by different code.** In process, the scrubber is pino's
   URL serialiser — `stripUrlQueries` in `src/lib/logger.ts`, wired as the
   `err`/`error` serialisers — which rewrites the error `message`, `stack`,
   `url` and `response.url` fields; `onRequestError` additionally runs its
   `errMessage` field through it. The other log barrier is the collector's
   redaction transform in layer 2. Neither one strips a bare `#fragment` from
   a non-error log field: a `#…` in `msg` or in any other field the error
   serialiser does not touch reaches Loki as written.
2. **Production collector, as a backstop.** Alloy's `privacy` transform
   (`otelcol.processor.transform` in the charts repo's `alloy-otlp`) repeats
   the span-name/URL-attribute work for anything that bypasses layer 1
   (`http.target`, `http.url`, `url.full`, span name), deletes `url.query`,
   and redacts `query=`, `q=`, `location=`, `coords=`, `lat=`/`lon=`/`lng=`,
   `key=`, `api_key=` and `token=` in log bodies and string attributes. Its
   `replace_pattern(…, "\\?.*$", "")` statements cut a span URL from the
   first `?` onward only, and its log statements only replace `key=value`
   values — a bare `#fragment` with no query string on a span is layer 1's
   job, and on a log it is no layer's.
3. **The local stack.** `observability/alloy/config.alloy` runs the same
   `privacy` transform statements as production (see
   [Local stack](#local-stack-composeyaml)), so a local trace or log carries
   the same data as the production one.

### What is instrumented

| Signal | Span / instrument | Where |
| --- | --- | --- |
| Traces | Next.js request/render/route spans (root span per request, RSC render spans, route-handler spans) | free once an OTel SDK is registered |
| Traces | `fetch <METHOD> <host><path-template>` for wrapped outgoing calls (`fetch <METHOD> <url>` for raw `fetch` calls); the query string is removed at export | `@vercel/otel` fetch instrumentation + `spanOptionsFor()` in `src/lib/telemetry/fetch.ts`; `propagateContextUrls` scoped to `API_URL`; `PrivacySpanExporter` |
| Traces | `response.parse` (JSON parse, `response.body.size`, `server.address`, `url.path`) | `src/app/(app)/shared/lib/fetchWrapper.ts` |
| Traces | Redis client span per command (`db.system = redis`) | `@opentelemetry/instrumentation-ioredis`, `requireParentSpan: true` |
| Traces | `arcjet.protect` (`url.path`, `arcjet.enforced`, `arcjet.conclusion`, `arcjet.decision_id`, `event_loop.utilization`, `arcjet.duration_ms`, `arcjet.reason_type` on a denial) | `src/lib/arcjet-page.ts` |
| Traces | `job <slug>` root span per Payload task run | `src/payload/jobs/tracedTask.ts` → `src/lib/telemetry/jobs.ts` |
| Metrics | `norse.*` application instruments | `src/lib/telemetry/*.ts` |
| Metrics | `nodejs.*` / `v8js.*` runtime instruments (event loop, GC, heap) | `@opentelemetry/instrumentation-runtime-node` |
| Logs | pino JSON on stdout **and** OTLP log records, correlated with `trace_id`/`span_id` | `src/lib/logger.ts` + `@opentelemetry/instrumentation-pino` |

Search text, location text, latitude/longitude pairs, client IP, cache keys,
full URLs with query strings, emails and user IDs are **never exported** in a
span attribute, a metric attribute or a log field. Span names and URL
attributes are scrubbed inside the process before export and again by the
collector (see [URL privacy](#url-privacy-three-layers) above), so the
attributes Next.js and `fetch` create at the source never reach Tempo,
Prometheus or Loki. The one exception is the opt-in, length-limited
`user_agent.original` root-span attribute, see
[Environment variables](#environment-variables).

### Resource attributes → Prometheus labels

Derived once per process in `resourceAttributes()` (`src/instrumentation.node.ts`):

| Resource attribute | Prometheus |
| --- | --- |
| `service.name` = `norse-app` | `job="norse-app"` |
| `service.instance.id` = `os.hostname()` (random UUID if empty) | `instance` |
| `deployment.environment.name` (`production` \| `dev` \| `local`, `unknown` when unset) | `env` (datapoint attribute, set by the collector's `transform`) |
| `host.name`, `process.creation.time`, `service.version` | labels on `target_info` |

`job`, `env` and `instance` are what every query below filters on. `norse-api`
reports `job="norse-api"` with the same `env` convention, so one dashboard
query can cover both services.

## Sampling

Sampling is decided **once per request, in this process**:

```ts
traceSampler: new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0')),
})
```

- **Norse is the trace root.** Incoming `traceparent` is deliberately ignored:
  `InjectOnlyTraceContextPropagator` (`src/instrumentation.ts`) overrides
  `extract()` to return the context unchanged. Requests arrive with a
  `traceparent` added by DO App Platform / Cloudflare whose parent span never
  reaches our Tempo; continuing it produced rootless, hours-long traces and
  let the upstream flag decide sampling. It still **injects** on outgoing
  calls.
- **Production samples 10%** (`OTEL_TRACES_SAMPLER_ARG=0.1`). Dev may run
  `1`. Do not go above `0.1` in production.
- `TraceIdRatioBasedSampler` is a pure function of `(traceId, ratio)`, and
  `ParentBasedSampler` honours a parent's decision instead of re-deciding. So
  the ratio is **not** something the two services must keep in sync.
- **`-01` / `-00` to norse-api.** `@vercel/otel` injects `traceparent` only for
  spans it sampled (`-01`). For an unsampled request the span does not exist,
  so `injectTraceparent()`
  (`src/lib/telemetry/fetch.ts`) injects the active (unsampled) context itself,
  producing `…-00`, and never overwrites a header that is already present.
  Either way norse-api receives a parent decision and never re-roots a Norse
  request. Norse-api's own `ParentBasedSampler` follows it.
- A non-Norse caller that hits `norse-api` directly still gets sampled by the
  API's own root ratio; that is out of scope here.

Timers do not keep a request's context. Anything long-lived leaves it when it
starts: the blocked-traffic flush timer runs under `ROOT_CONTEXT`
(`src/lib/blocked-traffic-counter.ts`), and Payload job handlers run inside
`inNewTrace()` (`src/payload/jobs/tracedTask.ts`). Use `inNewTrace` from
`src/lib/tracing.ts` for new background work.

### Finding the cause of a rootless trace

Open the trace and look at its topmost span:

- **`norse-api` spans only** — the API recorded a request whose parent never
  arrived. Either a caller sent it `traceparent` directly, or the `norse-app`
  span was lost on export.
- **A `norse-app` span named after the request method, with a parent span ID**
  — an inbound `traceparent` from a build older than the propagator above.
- **A `fetch …` or `job …` span in a trace older than the search window** — a
  timer that kept a request's context. The root exists but falls outside the
  range Grafana searched; widen the range.
- **A mix, only under load** — `BatchSpanProcessor` drops spans once its
  2048-span queue is full, without logging at the default level. Raise
  `OTEL_BSP_MAX_QUEUE_SIZE` or lower the sampling ratio.

## Environment variables

Final set for **both** App Platform apps. The dev app uses
`DEPLOYMENT_ENVIRONMENT=dev` (and may keep `OTEL_TRACES_SAMPLER_ARG=1`); prod
uses `production` and `0.1`. Secrets are provisioned in App Platform, never in
the repo:

```
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.c211.io
OTEL_EXPORTER_OTLP_USERNAME=<secret>
OTEL_EXPORTER_OTLP_PASSWORD=<secret>
OTEL_TRACES_SAMPLER_ARG=0.1        # dev may use 1
DEPLOYMENT_ENVIRONMENT=production   # or dev
APP_VERSION=${_self.COMMIT_HASH}    # App Platform bindable variable; verify the name
OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT=512
# remove: OTEL_SERVICE_NAME, OTEL_PROPAGATORS, PROMETHEUS_TOKEN
```

When `DEPLOYMENT_ENVIRONMENT` is unset or empty the resource attribute is
`unknown` (never guessed as production) and `register()` logs
`DEPLOYMENT_ENVIRONMENT is not set: telemetry is labelled unknown`.

Also honoured by the code, when set:

| Variable | Effect |
| --- | --- |
| `OTEL_EXPORTER_OTLP_HEADERS` | Set **by the app** at startup: `OTEL_EXPORTER_OTLP_USERNAME`:`OTEL_EXPORTER_OTLP_PASSWORD` become `Authorization=Basic …` (URL-encoded). Do not set it by hand; any existing non-`Authorization` entries are preserved. |
| `OTEL_METRICS_EXPORTER=none` | Disables metrics entirely (no reader, no runtime instrumentation, no `norse.*` instruments). Used when the collector cannot accept metrics yet. |
| `OTEL_LOGS_EXPORTER=none` | Disables OTLP logs (pino still logs JSON to stdout). Used when the collector cannot accept logs yet. |
| `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT` | Positive integer; caps `user_agent.original` on the root span. Recommended `512`. |
| `OTEL_ROOT_SPAN_EXTRAS=1` | Opt-in: on the **root** span only, sets `server.address` (Host header) and a length-limited `user_agent.original` (`src/proxy.ts`). |
| `NEXT_PUBLIC_LOG_LEVEL` | pino level (`debug` in development, `info` otherwise, by default). |
| `API_URL` | Scope for `traceparent` injection. Without it a warning is logged and no header reaches norse-api. |

Removed / do not set: `OTEL_SERVICE_NAME` (the service name is hardcoded
`norse-app`; prod and dev are the same service, told apart by `env`),
`OTEL_PROPAGATORS` (code-level `propagators` overrides it and baggage is not
used), `PROMETHEUS_TOKEN` and the old `/api/metrics` scrape endpoint,
`NEXT_OTEL_FETCH_DISABLED` (the app no longer sets it; `@vercel/otel` sets it in
its own fetch instrumentation).

If `OTEL_EXPORTER_OTLP_ENDPOINT` is unset, `register()` logs
`Tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set` and returns; the app
runs normally. A wrong endpoint or password never breaks requests: every setup
step is isolated and a broken signal is reported once with
`telemetry setup failed; continuing without that signal`.

## Metrics

The Alloy Prometheus exporter converts OTLP names with `add_metric_suffixes`
on (its default): dots become underscores, counters get `_total`, histograms
become `_bucket`/`_sum`/`_count`, and units become suffixes (`s` → `_seconds`,
`By` → `_bytes`, `1` → `_ratio`; a `{…}` unit adds none). Every sample also
carries `otel_scope_name`/`otel_scope_version`.

The OTel instrument name is the source of truth in code; the **Prometheus
name** is what you query.

### Application metrics

| OTel instrument | Prometheus name | Type | Labels | Source |
| --- | --- | --- | --- | --- |
| `norse.downstream.requests` | `norse_downstream_requests_total` | counter | `dependency`, `operation`, `outcome` | `src/lib/telemetry/dependency.ts` |
| `norse.downstream.duration` | `norse_downstream_duration_seconds` (`_bucket`/`_sum`/`_count`) | histogram (s) | `dependency`, `operation`, `outcome` | `src/lib/telemetry/dependency.ts` |
| `norse.response.parse.size` | `norse_response_parse_size_bytes` | histogram (By) | `dependency`, `operation` | `src/lib/telemetry/dependency.ts` |
| `norse.arcjet.decisions` | `norse_arcjet_decisions_total` | counter | `conclusion`, `enforced` | `src/lib/telemetry/arcjet.ts` |
| `norse.search.requests` | `norse_search_requests_total` | counter | `api`, `cache_hit`, `limit` | `src/lib/telemetry/search.ts` |
| `norse.jobs.runs` | `norse_jobs_runs_total` | counter | `task`, `result` | `src/lib/telemetry/jobs.ts` |
| `norse.jobs.duration` | `norse_jobs_duration_seconds` | histogram (s) | `task`, `result` | `src/lib/telemetry/jobs.ts` |
| `norse.jobs.last_success` | `norse_jobs_last_success_seconds` | observable gauge (s, unix time) | `task` | `src/lib/telemetry/jobs.ts` |
| `norse.process.active_resources` | `norse_process_active_resources` | observable gauge | `type` | `src/instrumentation.node.ts` |

Label values are fixed enums; nothing derived from a request (IDs, search
text, hosts) is a label:

- `dependency`: `norse_api`, `arcjet`, `redis`, `payload_api`, `keycloak`,
  `umami`, `ems`, `webhook`, `translation`, `other`
- `operation`: per dependency, from the fixed list in
  `src/lib/telemetry/dependency.ts` (e.g. `search_v1`, `search_v2`,
  `resource_get`, `decide`, `get`/`set`/`incr`/`del`, `tenant_basic_config`,
  `auth_session`, `token`, `share`, `alert`, `azure`); anything unknown maps to
  `other`
- `outcome`: `ok` \| `timeout` \| `error`
- `conclusion`: `ALLOW`, `CHALLENGE`, `DENY`, `DENIED_NOT_ENFORCED`, `ERROR`,
  `THREW`, `SKIPPED`, `NO_CLIENT_IP`
- `enforced`, `cache_hit`: `"true"` \| `"false"`
- `limit`: `le25` \| `le50` \| `gt50` (page size; 25 is the default)
- `result` (jobs): `success` \| `failed` \| `noop`

Notes on semantics:

- `norse_downstream_duration` is measured **in this process**, so it includes
  our event-loop delay. Its buckets are
  `0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10` — identical to
  the API's `norse_downstream_duration_seconds`, so one dashboard query works
  for both services.
- `404` for `norse_api`/`resource_get` is `ok` ("no such resource" is a valid
  answer); other `4xx`/`5xx`, network failures and JSON parse failures are
  `error`; `TimeoutError`/`AbortError`/`Command timed out` are `timeout`.
  `fetchWrapper` calls that turn an error into `null` are classified **before**
  that.
- `SKIPPED` and `NO_CLIENT_IP` Arcjet decisions record nothing downstream (no
  call happened); they do increment `norse_arcjet_decisions_total`.
- `norse_jobs_last_success_seconds` only moves on `success`; `noop`
  (`deliverScheduledPdfs` outside its delivery hour) does not count.
- `norse_process_active_resources` reads `process.getActiveResourcesInfo()` at
  collection time; it keeps the ten most common `type` values and sums the rest
  into `type="other"`.

### Runtime metrics

Registered by `new RuntimeNodeInstrumentation({ monitoringPrecision: 10 })`:

| Prometheus name | Type | Labels / unit |
| --- | --- | --- |
| `nodejs_eventloop_utilization_ratio` | gauge | ratio 0–1 of time the loop was busy since the previous collection |
| `nodejs_eventloop_time_seconds_total` | observable counter | `nodejs_eventloop_state` = `active` \| `idle` |
| `nodejs_eventloop_delay_{min,max,mean,stddev,p50,p90,p99}_seconds` | gauge | event-loop delay histogram percentiles |
| `v8js_gc_duration_seconds_bucket` | histogram | `v8js_gc_type` (`major`, `minor`, `incremental`, `weakcb`) |
| `v8js_memory_heap_used_bytes` | gauge | `v8js_heap_space_name` |
| `v8js_memory_heap_space_available_size_bytes` | gauge | `v8js_heap_space_name` |
| `v8js_memory_heap_space_physical_size_bytes` | gauge | `v8js_heap_space_name` |
| `v8js_memory_heap_space_size_bytes` | observable up/down counter | `v8js_heap_space_name` |

The same instrumentation also exports `v8js.resource.active` (`{resource}`
unit, `v8js.resource.type` attribute); it overlaps with
`norse_process_active_resources` and is not used by dashboards.

### Useful queries

```promql
# one series per container, per environment; target_info carries the environment
# as the resource-derived deployment_environment_name label, not `env`
count by (instance) (target_info{job="norse-app", deployment_environment_name="dev"})

# downstream outcomes
sum by (dependency, operation, outcome) (rate(norse_downstream_requests_total{job="norse-app", env="dev"}[5m]))

# downstream p95, comparable with norse-api
histogram_quantile(0.95, sum by (le, dependency) (rate(norse_downstream_duration_seconds_bucket{job="norse-app", env="dev"}[5m])))

# Arcjet
sum by (conclusion, enforced) (rate(norse_arcjet_decisions_total{job="norse-app", env="dev"}[5m]))
sum(rate(norse_arcjet_decisions_total{conclusion=~"ERROR|THREW"}[5m]))
  / sum(rate(norse_arcjet_decisions_total{conclusion!~"SKIPPED|NO_CLIENT_IP"}[5m]))

# search (no query text anywhere in these labels)
sum by (cache_hit, limit) (rate(norse_search_requests_total{job="norse-app", env="dev"}[5m]))

# event loop
max by (instance) (nodejs_eventloop_delay_p99_seconds{job="norse-app", env="production"})
max by (instance) (nodejs_eventloop_utilization_ratio{job="norse-app", env="production"})
```

Metrics are exported every 60 s with a cumulative temporality and a 10 s
timeout; a single broken export does not stop the reader.

## Logs

pino writes one JSON object per line to **stdout** (visible in DigitalOcean's
log viewer) and the same record goes to the Logs SDK → OTLP → Loki. The pino
instrumentation adds log correlation, so every line carries the IDs of the
active span.

| Field | Meaning |
| --- | --- |
| `level` | `debug` \| `info` \| `warn` \| `error` … (string label) |
| `time` | ISO 8601 timestamp |
| `env` | `NODE_ENV` |
| `module` | `createLogger('<module>')` — e.g. `instrumentation`, `arcjet` |
| `event` | Stable event name on structured lines (see below) |
| `msg` | Human-readable message |
| `trace_id`, `span_id`, `trace_flags` | Added by the pino instrumentation; `trace_id` opens the trace in Tempo when it was sampled |
| `err` / `error` | Serialized error (`name`, `message`, `stack`) |

Events worth knowing:

| `event` | Level | Fields |
| --- | --- | --- |
| `arcjet_fingerprint_failed` | warn | `host`, `pathName`, `conclusion`, `errorType`, `message`, `decisionId?`, `durationMs`, `eventLoopUtilization`, `instance`, `traceId?`, `traceSampled?`, `headers` (redacted; sampled to ≤5/min) |
| `arcjet_fingerprint_failed_sampled_out` | warn | the same minus `headers` (the header line was over the per-minute sample budget) |
| `arcjet_no_client_ip` / `arcjet_no_client_ip_sampled_out` | warn | `host`, `pathName`, `ipSrc`, `doConnectingIp`, `forwardedFor` (masked), `headers?` (redacted) |
| `arcjet_denied` | warn | `host`, `pathName`, `reason`, `reasonType`, `deniedBots`, `decisionId`, `enforced`, `sampledOutSinceLast` (≤30/min) |
| `request_error` | error | `routePath`, `routeType`, `method`, `digest`, `errName`, `errMessage` — never `request.path`, which can contain a query string |
| — | info/error | `Initialized telemetry` (`endpoint`, `traceSamplerArg`, `basicAuth`, `metrics`, `logs`) and `telemetry setup failed; continuing without that signal` (`signal`, `err`) |

The fields above live in the JSON line body (query them with `| json`). Loki
labels the stream `service_name="norse-app"` (the OTLP `service.name`) and, in
production, `env` (the collector's resource attribute, indexed by
`otlp_config.resource_attributes`); everything else arrives as structured
metadata. Typical queries:

```logql
{service_name="norse-app"} | json | trace_id != ""
{service_name="norse-app"} | json | event=~"arcjet_fingerprint_failed.*"
  | line_format "{{.durationMs}} {{.eventLoopUtilization}} {{.instance}}"
{service_name="norse-app"} | json | event="request_error"
```

Search text must never appear: the query
`{service_name="norse-app"} |~ "query=" != "query=REDACTED"` returns nothing.
The `!=` is required because the collector's redaction (layer 2) rewrites a
leaked `query=…` to `query=REDACTED`, so without it a caught leak would look
like a clean result.

## Reading Arcjet failures

`arcjet_fingerprint_failed` is logged whenever the Arcjet Decide call throws or
returns an errored decision, with the timing of **only** the `client.protect()`
call:

| Field | Meaning |
| --- | --- |
| `durationMs` | Wall time of the protect call, measured in this process |
| `eventLoopUtilization` | Share of that window (0–1) the event loop was busy, as a delta over the same window |
| `instance` | Container hostname: which replica |
| `traceId`, `traceSampled` | Current trace, and whether it was sampled (only a sampled ID opens Tempo) |
| `conclusion` | `THREW` (call threw) or `ERROR` (Decide API answered with an errored decision) |

`ARCJET_TIMEOUT_MS` (default `500`, positive integer) is the Decide API timeout.
The page fails open in every failure case.

| Observation | Reading |
| --- | --- |
| `durationMs ≈ 500` **and** low `eventLoopUtilization` | Our timer fired on time; Arcjet (or the network path to it) did not answer within the timeout. Their side. |
| `durationMs ≫ 500` (e.g. > 600) | Our timer fired late. The delay above 500 ms (`durationMs − 500`) is roughly how long our event loop was blocked. Our side. |
| `durationMs` well under 500 with `conclusion="THREW"` | Transport/DNS/TLS failure or a thrown client error, not a Decide timeout. Check egress and the Arcjet service status. |
| `conclusion="ERROR"` at ≈ 500 ms | The Decide API timeout (`ARCJET_TIMEOUT_MS`), i.e. the same case as the first row. |
| `traceSampled=false` | The failure happened in an unsampled request; only the log line exists. Raise `OTEL_TRACES_SAMPLER_ARG` temporarily on dev to reproduce. |
| The same `instance` recurs while other replicas are healthy | Congestion on that container, not a fleet-wide Arcjet problem. Check that instance's event-loop metrics. |
| Timeouts spread evenly across all `instance` values | Arcjet latency or the network path, not our process. |

Timeout ratio (all instances):

```promql
sum(rate(norse_arcjet_decisions_total{conclusion=~"ERROR|THREW"}[5m]))
  / sum(rate(norse_arcjet_decisions_total{conclusion!~"SKIPPED|NO_CLIENT_IP"}[5m]))
```

## Event loop vs dependency: which side is slow?

`norse_downstream_duration` includes our own event-loop delay, so a slow
histogram does not by itself mean the dependency is slow. Read it next to the
runtime metrics:

| Pattern | Reading | Next step |
| --- | --- | --- |
| **All** dependencies slow together, on **one** `instance`, with high `nodejs_eventloop_delay_p99_seconds` / `nodejs_eventloop_utilization_ratio` | Our process on that container (Payload in the same process, GC, CPU limit, a blocking job) | Look at `v8js_gc_duration_seconds_bucket`, `norse_process_active_resources`, CPU on that container; correlate with log `instance` |
| **One** dependency slow on **all** instances, event loop normal | That dependency (or the network path to it) | Check the dependency's own metrics/logs; compare `norse_api` timings with norse-api's own histograms for the same `operation` |
| Slow on **one** instance only, event loop normal | Network egress / that container's path | Check `nodejs_eventloop_*` on the instance and the dependency's view of the same requests |
| `norse_downstream_duration` p95 high but `response.parse` span and the dependency's own p95 low | Time spent before/after the call in our process | Inspect the root span's children and the event-loop metrics |

Practical order:

1. `max by (instance) (nodejs_eventloop_delay_p99_seconds{job="norse-app"})` —
   is the loop behind on one instance or all?
2. `sum by (dependency) (rate(norse_downstream_duration_seconds_sum[5m])) / sum by (dependency) (rate(norse_downstream_duration_seconds_count[5m]))`
   — mean per dependency; then split by `instance`.
3. If everything on one instance is slow *and* the loop metrics are high, it is
   our process; if only one dependency is slow everywhere, it is that
   dependency.
4. `norse_arcjet_decisions_total{conclusion="ERROR"}` plus the table above tells
   whether Arcjet timeouts are a symptom of the same congestion (high
   `eventLoopUtilization` → ours) or independent (low → theirs).

## Why OTel JS 2.x (and not 3.x)

The app is pinned to the **OTel JS 2.x / 0.222** line:

| Package | Version |
| --- | --- |
| `@opentelemetry/api` | 1.9.1 |
| `@opentelemetry/core`, `sdk-metrics` | 2.12.0 |
| `@opentelemetry/sdk-trace-base` | 2.12.x |
| `@opentelemetry/instrumentation` | 0.222.0 |
| `@opentelemetry/exporter-{metrics,logs}-otlp-proto` | 0.222.0 |
| `@opentelemetry/instrumentation-runtime-node` | 0.35.0 |
| `@opentelemetry/instrumentation-pino` | 0.68.0 |
| `@vercel/otel` | 2.1.3 |

`@vercel/otel` 2.1.3 declares peer ranges of `>=2 <3` for
`resources`/`sdk-metrics`/`sdk-trace-base`, `>=1.9 <2` for `@opentelemetry/api`,
and `>=0.200 <0.300` for `api-logs`/`sdk-logs`/`instrumentation`. Next.js's
automatic instrumentation hook is what makes `register()` (and therefore
`registerOTel()`) work without a manual `NodeSDK`, and it brings the fetch
instrumentation that does real header propagation — so the SDK version is
constrained by `@vercel/otel`, not chosen freely. Upgrading to OTel 3.x means
waiting for a `@vercel/otel` release that supports it; `sdk-trace-base` is on
`scripts/deprecated-allowlist.txt` for exactly this reason.

After any install, `npm ls @opentelemetry/api @opentelemetry/sdk-metrics
@opentelemetry/core` must show **one** copy of each. A second copy of the API
silently breaks context propagation (two registries: spans created with one are
invisible to the other). Fix with `npm dedupe` or by aligning versions.

`@vercel/otel` is used instead of a hand-rolled `NodeSDK` because Next's own
fetch span only *creates* a span — it does not inject `traceparent` into the
outgoing request. `@vercel/otel`'s fetch instrumentation does, scoped by
`propagateContextUrls` to `API_URL` so only norse-api receives a header (not
Keycloak, S3, Umami, Mapbox, Translate, …). Because both patch the global
`fetch`, `@vercel/otel` sets `NEXT_OTEL_FETCH_DISABLED` itself so only its
instrumentation traces outgoing calls.

## Local stack (`compose.yaml`)

The local stack mirrors the production signal path — same OTLP entry point,
same `env` convention, same Grafana datasource UIDs:

```
norse-app --OTLP--> alloy :4317/:4318 --+--> tempo        (traces, metrics_generator -> prometheus)
                                        +--> prometheus   (remote write, exemplars)
                                        +--> loki         (logs, OTLP)
grafana :3001  (datasources: prometheus, loki, tempo)
```

- `alloy` — [`observability/alloy/config.alloy`](/observability/alloy/config.alloy),
  the local equivalent of production's `alloy-otlp`: `otelcol.receiver.otlp`
  (gRPC 4317, HTTP 4318) → `otelcol.processor.transform` (`privacy`, the same
  statements as production: `http.target`/`http.url`/`url.full` and span names
  cut at the first `?`, `url.query` deleted, and `query=`/`coords=`/`key=`/
  `token=`-style values redacted in log bodies and attributes) →
  `otelcol.processor.transform` (`env` from `deployment.environment.name`) →
  `otelcol.processor.batch` → Tempo (traces), Prometheus remote write with
  exemplars (metrics), Loki OTLP (logs). Local traces and logs therefore match
  production. As in production, the collector statements only cut a span URL
  from `?` onward and only redact `key=value` pairs in a log; a bare
  `#fragment` with no query string on a span is removed earlier, by the
  in-process `PrivacySpanExporter`, and one in a log field that the pino error
  serialiser does not cover is removed by no layer.
- `tempo` — [`tempo.yaml`](/tempo.yaml), monolithic Tempo 3 with the
  `service-graphs` and `span-metrics` processors remote-writing to Prometheus.
  Only its query API (3200) is published; OTLP goes through Alloy.
- `prometheus` — remote-write receiver and exemplar storage enabled, 2 d
  retention.
- `loki` — [`observability/loki/config.yaml`](/observability/loki/config.yaml),
  single binary, filesystem storage, schema v13, structured metadata allowed.
- `grafana` — datasources `prometheus`, `loki`, `tempo` (the UIDs the
  production dashboards use), with exemplar/`trace_id` → Tempo and Tempo →
  Loki/metrics links.

1. `docker compose up` (or your usual local stack).
2. Exercise a code path that calls the Norse API (e.g. load the search page).
3. Open Grafana (`http://localhost:3001`, `admin`/`admin`) → **Explore**:
   - **Tempo**: `{ resource.service.name = "norse-app" }` — a request root
     span plus a child `fetch` span carrying the propagated `traceparent`.
   - **Prometheus**: `norse_downstream_requests_total{env="local"}` and
     `nodejs_eventloop_delay_p99_seconds{env="local"}` after the first 60 s
     export.
   - **Loki**: `{service_name="norse-app"} | trace_id=~".+"`.
   Click the trace ID on a Loki line to jump into Tempo, and Tempo's log link
   to jump back.

`compose.yaml` sets `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy:4318` and
`DEPLOYMENT_ENVIRONMENT=local` for `norse-app`. For a non-dockerized
`npm run dev`, set the endpoint to `http://localhost:4318` (Alloy's OTLP HTTP
port is published on the host) and `DEPLOYMENT_ENVIRONMENT=local`. No
credentials are needed locally: the local Alloy accepts unauthenticated OTLP.

Seeing the **full** cross-service trace (norse-app → norse-api) locally
requires the API's own local OTLP exporter to point at this pipeline (e.g.
`http://localhost:4317` from the API's host, or `http://alloy:4317` if both
repos share a compose network). That is a `norse-api`-repo configuration
change, out of scope here.

## Out of scope

- Postgres spans (e.g. `@opentelemetry/instrumentation-pg`). Redis is traced;
  Postgres queries are not.
- Browser-side calls (SMS button, Payload admin components, the client error
  boundary). Only server-side work is instrumented; client-side page views go
  to Umami.
- Profiling, `node:inspector`, and any timer of ours. The only recurring work
  is the OTel SDK's own 60 s metric export and runtime instrumentation.
