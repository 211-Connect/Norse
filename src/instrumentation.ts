import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

import { createLogger } from '@/lib/logger';

const log = createLogger('instrumentation');

export function register() {
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

  // Next.js's own built-in fetch span does not propagate trace context.
  // Disable it so @vercel/otel's fetch instrumentation (which does, via
  // propagateContextUrls below) is the only one tracing outgoing fetches.
  process.env.NEXT_OTEL_FETCH_DISABLED = '1';

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    log.warn('API_URL not set: traceparent will not be sent to the Norse API');
  }

  registerOTel({
    serviceName: 'norse-app',
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
    }),
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
