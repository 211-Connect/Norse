import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

import { createLogger } from '@/lib/logger';

const log = createLogger('instrumentation');

/**
 * The container that produced a trace, as `host.name` on the OTel resource.
 * App Platform runs one container per instance and sets `HOSTNAME` to the
 * listen address, so the OS hostname is the only identity; it is also what
 * the Arcjet failure logs carry as `instance` (ISS-1739). Node only, hence
 * the runtime check and the dynamic import: `register()` also runs on the
 * Edge runtime, where `node:os` does not exist.
 */
async function instanceAttributes(): Promise<Record<string, string>> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return {};
  try {
    const { INSTANCE_ID, INSTANCE_STARTED_AT } = await import('@/lib/instance');
    return {
      'host.name': INSTANCE_ID,
      'service.instance.id': INSTANCE_ID,
      'process.creation.time': INSTANCE_STARTED_AT,
    };
  } catch (error) {
    log.warn({ err: error }, 'Instance id unavailable; traces carry none');
    return {};
  }
}

export async function register() {
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
    attributes: await instanceAttributes(),
    // On the root span of every request, so a trace can be filtered by
    // tenant host and told apart from bot traffic. The query string is not
    // a header, so no search text is recorded.
    attributesFromHeaders: {
      'server.address': 'host',
      'user_agent.original': 'user-agent',
    },
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
    }),
    instrumentationConfig: {
      fetch: {
        // Only inject `traceparent` for calls to the Norse API — not
        // Keycloak, S3, Umami, Mapbox, Azure/Google Translate, etc.
        propagateContextUrls: apiUrl ? [apiUrl] : [],
      },
    },
  });
}
