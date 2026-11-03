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

import { createLogger, stripUrlQueries } from '@/lib/logger';
import {
  PrivacySpanExporter,
  createOtlpTraceExporter,
} from '@/lib/privacy-span-exporter';

const log = createLogger('instrumentation');

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
 * `registerOtel` is injectable so the wiring test can inspect the exact
 * parameters handed to `@vercel/otel` (Next.js calls `register()` with none).
 */
export function register(registerOtel: typeof registerOTel = registerOTel) {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    log.info('Tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set');
    return;
  }

  const traceSamplerArg = process.env.OTEL_TRACES_SAMPLER_ARG || '1.0';
  log.info(
    { endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT, traceSamplerArg },
    'Initializing tracing',
  );

  const { OTEL_EXPORTER_OTLP_USERNAME, OTEL_EXPORTER_OTLP_PASSWORD } =
    process.env;
  if (OTEL_EXPORTER_OTLP_USERNAME && OTEL_EXPORTER_OTLP_PASSWORD) {
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
    log.info(
      { user: OTEL_EXPORTER_OTLP_USERNAME },
      'OTLP basic auth configured',
    );
  }

  // `@vercel/otel` sets NEXT_OTEL_FETCH_DISABLED itself in its fetch
  // instrumentation, disabling Next's built-in fetch span so the fetch
  // instrumentation below (which propagates context, scoped by
  // propagateContextUrls) is the only one tracing outgoing fetches.

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    log.warn('API_URL not set: traceparent will not be sent to the Norse API');
  }

  registerOtel({
    serviceName: 'norse-app',
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
    }),
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
    instrumentations: [
      'auto',
      // A span per Redis command (`cacheService`). Needs ioredis in
      // serverExternalPackages (next.config.js). requireParentSpan: no
      // orphan root spans from commands outside a request, such as the
      // connect-time ready check.
      new IORedisInstrumentation({ requireParentSpan: true }),
    ],
    instrumentationConfig: {
      fetch: {
        // Only inject `traceparent` for calls to the Norse API — not
        // Keycloak, S3, Umami, Mapbox, Azure/Google Translate, etc.
        propagateContextUrls: apiUrl ? [apiUrl] : [],
      },
    },
  });
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
    log.warn(
      { err: hookError },
      'onRequestError: failed to record exception on the active span',
    );
  }
  try {
    const errName = err instanceof Error ? err.name : 'unknown';
    // Same barrier as the `err` serializer: an error message can embed a
    // request URL, and this field is logged directly (privacy rule 8).
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
