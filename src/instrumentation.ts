import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { registerOTel } from '@vercel/otel';

export function register() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log('Tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set');
    return;
  }

  const traceSamplerArg = process.env.OTEL_TRACES_SAMPLER_ARG || '1.0';
  console.log(
    'Initializing tracing with endpoint:',
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    'and sampler ratio:',
    traceSamplerArg,
  );

  registerOTel({
    serviceName: 'norse-app',
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(parseFloat(traceSamplerArg)),
    }),
  });
}
