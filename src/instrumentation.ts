import type { Context, Exception, TextMapGetter } from '@opentelemetry/api';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

import type { Logger } from '@/lib/logger';
import {
  PrivacySpanExporter,
  createOtlpTraceExporter,
} from '@/lib/privacy-span-exporter';
import { markTelemetryReady } from '@/lib/telemetry/meter';

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
    const traceSamplerArg = process.env.OTEL_TRACES_SAMPLER_ARG || '1.0';
    const apiUrl = process.env.API_URL;
    const isNodeRuntime = process.env.NEXT_RUNTIME === 'nodejs';

    // Metrics and logs are Node-only: the exporters, the runtime
    // instrumentation and pino's require-hook cannot run on the Edge runtime.
    // The dynamic import keeps them out of the Edge bundle entirely, and the
    // module also builds the resource attributes shared by every signal.
    let nodeConfiguration: NodeTelemetryConfiguration = {};
    if (isNodeRuntime) {
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
      serviceName: 'norse-app',
      // Baggage is dropped on purpose; it is not used. Code-level
      // `propagators` overrides OTEL_PROPAGATORS.
      propagators: [new InjectOnlyTraceContextPropagator()],
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
      traceSampler: new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
      }),
      ...nodeOptions,
      instrumentations: [
        'auto',
        // A span per Redis command (`cacheService`). Needs ioredis in
        // serverExternalPackages (next.config.js). requireParentSpan: no
        // orphan root spans from commands outside a request, such as the
        // connect-time ready check.
        new IORedisInstrumentation({ requireParentSpan: true }),
        // Runtime-node (event loop, GC, heap) and pino (log correlation +
        // OTLP log records), when those signals are enabled.
        ...nodeInstrumentations,
      ],
      instrumentationConfig: {
        fetch: {
          // Only inject `traceparent` for calls to the Norse API — not
          // Keycloak, S3, Umami, Mapbox, Azure/Google Translate, etc.
          propagateContextUrls: apiUrl ? [apiUrl] : [],
        },
      },
    });

    // The meter provider is installed: instruments created from now on are
    // real. Without metrics (OTEL_METRICS_EXPORTER=none) there is no meter
    // provider to cache against, so the flag stays off.
    if (nodeConfiguration.metricReaders?.length) {
      markTelemetryReady();
    }

    // Logged only after registerOTel() so the lazy logger is created through
    // the pino instrumentation (see instrumentationLogger above).
    const log = await instrumentationLogger();
    log.info(
      {
        endpoint,
        traceSamplerArg,
        basicAuth: basicAuthConfigured,
        metrics: isNodeRuntime && process.env.OTEL_METRICS_EXPORTER !== 'none',
        logs: isNodeRuntime && process.env.OTEL_LOGS_EXPORTER !== 'none',
      },
      'Initialized telemetry',
    );
    if (!apiUrl) {
      log.warn(
        'API_URL not set: traceparent will not be sent to the Norse API',
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
