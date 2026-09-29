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

  registerOTel({
    serviceName: 'norse-app',
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
    }),
  });
}
