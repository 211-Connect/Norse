import type { Context, Exception, TextMapGetter } from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

import type { Logger } from '@/lib/logger';
import {
  PrivacySpanExporter,
  createOtlpTraceExporter,
} from '@/lib/privacy-span-exporter';
import { CMS_SECRET_HEADER } from '@/lib/cms/config';
import { getNorseRole, runsPayload } from '@/lib/norse-role';
import { markTelemetryReady } from '@/lib/telemetry/meter';
import {
  DEFAULT_TRACE_SAMPLE_RATIO,
  createTraceSampler,
  traceSampleRatio,
} from '@/lib/telemetry/sampler';

import type {
  NodeTelemetryConfiguration,
  TelemetrySetupError,
} from './instrumentation.node';

type InstrumentationLogger = Pick<Logger, 'info' | 'warn' | 'error'>;

let loggerPromise: Promise<InstrumentationLogger> | undefined;

/**
 * The app logger is loaded on demand rather than imported at module scope.
 *
 * `src/lib/logger.ts` creates its pino instance as soon as it is evaluated,
 * and `@opentelemetry/instrumentation-pino` can only patch a pino module that
 * is `require()`d after the instrumentation is enabled (inside `registerOTel`).
 * A static import here would therefore give the whole app an unpatched logger:
 * no `trace_id`/`span_id`, no OTLP log stream. Every log line in this file
 * happens after registration, so loading the logger lazily is safe.
 */
function instrumentationLogger(): Promise<InstrumentationLogger> {
  loggerPromise ??= import('@/lib/logger').then((module) =>
    module.createLogger('instrumentation'),
  );
  return loggerPromise;
}

/**
 * Norse is the entry point of our system. Requests arrive with a `traceparent`
 * added upstream (DO App Platform / Cloudflare) whose parent span never reaches
 * our Tempo. Continuing it makes traces rootless and lets the upstream flag decide
 * sampling. Never extract incoming context; still inject into outgoing Norse API
 * calls (scoped by propagateContextUrls).
 */
export class InjectOnlyTraceContextPropagator extends W3CTraceContextPropagator {
  // The carrier is ignored on purpose: never extract incoming context.
  extract(
    context: Context,
    _carrier: unknown,
    _getter: TextMapGetter,
  ): Context {
    return context;
  }
}

/**
 * Constant-time string comparison that also runs on the Edge runtime. Not
 * `src/lib/secrets.ts`: that helper uses `node:crypto`, and this module is
 * loaded by both the Node and the Edge runtime. Only the length can leak.
 */
function secretsMatch(received: string, expected: string): boolean {
  if (received.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return diff === 0;
}

/**
 * The CMS (`norse-cms`) continues a trace only for calls from our own app.
 *
 * Since the app/CMS split the app calls the CMS internal API over HTTP
 * (`PAYLOAD_CMS_URL`, e.g. `http://norse-cms:8080`), always with the
 * `x-internal-api-key` header. Those calls carry the app's `traceparent`, and
 * continuing it puts the CMS spans (Postgres included) under the app trace.
 *
 * Every other request (`/admin`, Payload REST from the browser, anything that
 * passed DO App Platform / Cloudflare) may carry an upstream `traceparent`
 * whose parent never reaches Tempo, so it is still ignored exactly like
 * `InjectOnlyTraceContextPropagator` does: no rootless traces.
 */
export class InternalCallerTraceContextPropagator extends InjectOnlyTraceContextPropagator {
  constructor(private readonly internalSecret: string) {
    super();
  }

  extract(context: Context, carrier: unknown, getter: TextMapGetter): Context {
    try {
      const raw = getter.get(carrier, CMS_SECRET_HEADER);
      const received = Array.isArray(raw) ? raw[0] : raw;
      if (
        this.internalSecret &&
        typeof received === 'string' &&
        secretsMatch(received, this.internalSecret)
      ) {
        return W3CTraceContextPropagator.prototype.extract.call(
          this,
          context,
          carrier,
          getter,
        );
      }
    } catch {
      // Telemetry must never break a request: fall back to a new root.
    }
    return context;
  }
}

/**
 * Propagator for this process. Only a process that serves the CMS internal
 * API (`cms`, or the single-process `all`) and knows the shared secret trusts
 * incoming context from authenticated internal calls; the public app never
 * does.
 */
export function createPropagator(
  env: Record<string, string | undefined> = process.env,
): InjectOnlyTraceContextPropagator {
  const secret = env.PAYLOAD_API_ROUTE_SECRET;
  if (!secret) return new InjectOnlyTraceContextPropagator();
  try {
    if (!runsPayload(getNorseRole(env.NORSE_ROLE, env.NORSE_BUILD))) {
      return new InjectOnlyTraceContextPropagator();
    }
  } catch {
    // An invalid role is reported elsewhere; never trust context then.
    return new InjectOnlyTraceContextPropagator();
  }
  return new InternalCallerTraceContextPropagator(secret);
}

/**
 * Outgoing calls that get a `traceparent`: the Norse API and, since the
 * app/CMS split, the CMS internal API. Nothing else (Keycloak, S3, Umami,
 * Mapbox, translation, ...). Matched by URL prefix; the trailing `/` keeps
 * `http://norse-cms:8080` from matching `http://norse-cms:80801`.
 */
export function propagateContextUrls(
  env: Record<string, string | undefined> = process.env,
): string[] {
  const urls: string[] = [];
  if (env.API_URL) urls.push(env.API_URL);
  const cmsUrl = env.PAYLOAD_CMS_URL?.trim();
  if (cmsUrl) urls.push(normalizedPrefix(cmsUrl));
  return urls;
}

/**
 * `@vercel/otel` compares the prefix with `url.toString()` of the outgoing
 * request, which is normalised (lowercase host, default port dropped:
 * `http://norse-cms:80/x` becomes `http://norse-cms/x`). Normalise the prefix
 * the same way, ending in exactly one `/`, or propagation silently stops.
 */
function normalizedPrefix(raw: string): string {
  try {
    return new URL(raw).href.replace(/\/*$/, '/');
  } catch {
    return `${raw.replace(/\/+$/, '')}/`;
  }
}

/**
 * `service.name` by role, so prod and dev share one name per service and the
 * environment comes from `DEPLOYMENT_ENVIRONMENT` (OTel convention). The CMS
 * reports as `norse-cms`; the public app and the single-process `all` as
 * `norse-app`. An explicit `OTEL_SERVICE_NAME` still wins (`@vercel/otel`
 * reads it first).
 */
export function serviceNameForRole(
  env: Record<string, string | undefined> = process.env,
): 'norse-app' | 'norse-cms' {
  try {
    return getNorseRole(env.NORSE_ROLE, env.NORSE_BUILD) === 'cms'
      ? 'norse-cms'
      : 'norse-app';
  } catch {
    return 'norse-app';
  }
}

/**
 * Turns `OTEL_EXPORTER_OTLP_USERNAME`/`PASSWORD` into the `Authorization`
 * header the OTLP exporters read. Must run before the exporters are
 * constructed (they read the environment once, at construction).
 */
function configureOtlpBasicAuth(): boolean {
  const { OTEL_EXPORTER_OTLP_USERNAME, OTEL_EXPORTER_OTLP_PASSWORD } =
    process.env;
  if (!OTEL_EXPORTER_OTLP_USERNAME || !OTEL_EXPORTER_OTLP_PASSWORD) {
    return false;
  }

  const basicAuth = Buffer.from(
    `${OTEL_EXPORTER_OTLP_USERNAME}:${OTEL_EXPORTER_OTLP_PASSWORD}`,
  ).toString('base64');
  // OTEL_EXPORTER_OTLP_HEADERS is a comma-separated list of key=value
  // pairs where each value must be URL-encoded, per the OTel spec.
  const authHeader = `Authorization=${encodeURIComponent(`Basic ${basicAuth}`)}`;
  const existingHeaders = (process.env.OTEL_EXPORTER_OTLP_HEADERS || '')
    .split(',')
    .filter((header) => header && !header.startsWith('Authorization='));
  process.env.OTEL_EXPORTER_OTLP_HEADERS = [
    ...existingHeaders,
    authHeader,
  ].join(',');
  return true;
}

/**
 * `registerOtel` is injectable so the wiring test can inspect the exact
 * parameters handed to `@vercel/otel` (Next.js calls `register()` with none).
 */
export async function register(
  registerOtel: typeof registerOTel = registerOTel,
) {
  const setupErrors: TelemetrySetupError[] = [];

  try {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    if (!endpoint) {
      const log = await instrumentationLogger();
      log.info('Tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set');
      return;
    }

    const basicAuthConfigured = configureOtlpBasicAuth();
    // Unset or invalid falls back to the production ratio (0.1), never to 1:
    // a component that forgot the variable must not trace every request.
    const sampleRatio = traceSampleRatio(process.env.OTEL_TRACES_SAMPLER_ARG);
    const apiUrl = process.env.API_URL;

    // Metrics and logs are Node-only: the exporters, the runtime
    // instrumentation and pino's require-hook cannot run on the Edge runtime.
    // The literal comparison (not a boolean variable) is what lets Turbopack
    // fold the branch and drop the import from the Edge bundle; the module
    // also builds the resource attributes shared by every signal.
    let nodeConfiguration: NodeTelemetryConfiguration = {};
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      try {
        const { createNodeTelemetryOptions } =
          await import('./instrumentation.node');
        const node = createNodeTelemetryOptions();
        nodeConfiguration = node.configuration;
        setupErrors.push(...node.errors);
      } catch (error) {
        setupErrors.push({ signal: 'node', error });
      }
    }

    const { instrumentations: nodeInstrumentations = [], ...nodeOptions } =
      nodeConfiguration;

    registerOtel({
      serviceName: serviceNameForRole(),
      // Baggage is dropped on purpose; it is not used. Code-level
      // `propagators` overrides OTEL_PROPAGATORS.
      propagators: [createPropagator()],
      // Every exported span passes through `PrivacySpanExporter`: query strings
      // and fragments never leave the process (privacy rule 8). A sole
      // `spanProcessors` entry, because `traceExporter` would leave
      // `@vercel/otel`'s env-configured exporter installed as well whenever
      // OTEL_EXPORTER_OTLP_ENDPOINT is set, exporting every span unchecked.
      spanProcessors: [
        new BatchSpanProcessor(
          new PrivacySpanExporter(createOtlpTraceExporter()),
        ),
      ],
      // Health checks (`/api/health`, `/api/healthz`) are never traced; every
      // other root is sampled at the ratio, children follow their parent.
      traceSampler: createTraceSampler(
        sampleRatio.ratio,
        process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH ?? '',
      ),
      ...nodeOptions,
      instrumentations: [
        'auto',
        // A span per Redis command (`cacheService`). Needs ioredis in
        // serverExternalPackages (next.config.js). requireParentSpan: no
        // orphan root spans from commands outside a request, such as the
        // connect-time ready check.
        new IORedisInstrumentation({ requireParentSpan: true }),
        // Node runtime only: Postgres query spans (always), runtime-node
        // (event loop, GC, heap) and pino (log correlation + OTLP log
        // records) when those signals are enabled.
        ...nodeInstrumentations,
      ],
      instrumentationConfig: {
        fetch: {
          // Norse API + CMS internal API only (see propagateContextUrls).
          propagateContextUrls: propagateContextUrls(),
        },
      },
    });

    // The meter provider is installed: instruments created from now on are
    // real. Without metrics (OTEL_METRICS_EXPORTER=none) there is no meter
    // provider to cache against, so the flag stays off.
    if (
      process.env.NEXT_RUNTIME === 'nodejs' &&
      nodeConfiguration.metricReaders?.length
    ) {
      markTelemetryReady();
      try {
        // Observable gauge: reads process.getActiveResourcesInfo() at
        // collection time, so it must be created after the provider exists.
        const { registerActiveResourcesGauge } =
          await import('./instrumentation.node');
        registerActiveResourcesGauge();
      } catch (error) {
        setupErrors.push({ signal: 'metrics', error });
      }
    }

    // Logged only after registerOTel() so the lazy logger is created through
    // the pino instrumentation (see instrumentationLogger above).
    const log = await instrumentationLogger();
    log.info(
      {
        endpoint,
        // The ratio in effect (after the fallback), not the raw variable.
        traceSamplerArg: sampleRatio.ratio,
        basicAuth: basicAuthConfigured,
        metrics:
          process.env.NEXT_RUNTIME === 'nodejs' &&
          process.env.OTEL_METRICS_EXPORTER !== 'none',
        logs:
          process.env.NEXT_RUNTIME === 'nodejs' &&
          process.env.OTEL_LOGS_EXPORTER !== 'none',
      },
      'Initialized telemetry',
    );
    if (sampleRatio.fallbackReason) {
      log.warn(
        {
          reason: sampleRatio.fallbackReason,
          ratio: DEFAULT_TRACE_SAMPLE_RATIO,
        },
        'OTEL_TRACES_SAMPLER_ARG is unset or invalid: sampling at the default ratio',
      );
    }
    if (!apiUrl) {
      log.warn(
        'API_URL not set: traceparent will not be sent to the Norse API',
      );
    }
    // `resourceAttributes` labels an unset environment `unknown`; say so once,
    // because every dashboard filters on `env`.
    if (!process.env.DEPLOYMENT_ENVIRONMENT) {
      log.warn(
        'DEPLOYMENT_ENVIRONMENT is not set: telemetry is labelled unknown',
      );
    }
  } catch (error) {
    setupErrors.push({ signal: 'register', error });
  } finally {
    // Telemetry must never break the app (plan rule 7). Each failed signal is
    // reported once, after the rest of the SDK is up.
    if (setupErrors.length > 0) {
      try {
        const log = await instrumentationLogger();
        for (const { signal, error } of setupErrors) {
          log.error(
            { err: error, signal },
            'telemetry setup failed; continuing without that signal',
          );
        }
      } catch {
        // Logging is best effort here: never throw out of register().
      }
    }
  }
}

type RequestErrorContext = Readonly<{
  routerKind: 'Pages Router' | 'App Router';
  routePath: string;
  routeType: 'render' | 'route' | 'action' | 'proxy';
  renderSource?:
    | 'react-server-components'
    | 'react-server-components-payload'
    | 'server-rendering';
  revalidateReason: 'on-demand' | 'stale' | undefined;
}>;

/**
 * Next.js request-error hook (signature from next/dist/server/instrumentation
 * in Next 16.4.2). Records the error on the active span (if any), marks it
 * ERROR, and logs the failure once. `request.path` is deliberately not logged:
 * it can contain a query string (privacy rule 8).
 */
export async function onRequestError(
  err: unknown,
  request: Readonly<{
    path: string;
    method: string;
    headers: NodeJS.Dict<string | string[]>;
  }>,
  ctx: RequestErrorContext,
): Promise<void> {
  // Telemetry must never break the app (plan rule 7).
  try {
    const span = trace.getActiveSpan();
    if (span) {
      span.recordException(err as Exception);
      span.setStatus({ code: SpanStatusCode.ERROR });
    }
  } catch (hookError) {
    try {
      const log = await instrumentationLogger();
      log.warn(
        { err: hookError },
        'onRequestError: failed to record exception on the active span',
      );
    } catch {
      // Never break the app because of telemetry.
    }
  }
  try {
    const errName = err instanceof Error ? err.name : 'unknown';
    // Loaded on demand for the same reason as `instrumentationLogger`: a
    // static import of `@/lib/logger` would create pino before the
    // instrumentation is enabled. Same barrier as the `err` serializer: an
    // error message can embed a request URL, and this field is logged
    // directly (privacy rule 8).
    const { stripUrlQueries } = await import('@/lib/logger');
    const errMessage = stripUrlQueries(
      err instanceof Error ? err.message : String(err),
    );
    const digest =
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      typeof err.digest === 'string'
        ? err.digest
        : undefined;
    const log = await instrumentationLogger();
    log.error(
      {
        event: 'request_error',
        routePath: ctx.routePath,
        routeType: ctx.routeType,
        method: request.method,
        digest,
        errName,
        errMessage,
      },
      'request error',
    );
  } catch {
    // Never break the app because of telemetry.
  }
}
