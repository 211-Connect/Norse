import { randomUUID } from 'node:crypto';
import os from 'node:os';

import type { Attributes } from '@opentelemetry/api';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import {
  AggregationType,
  PeriodicExportingMetricReader,
  type ViewOptions,
} from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import type { Configuration } from '@vercel/otel';

import { countActiveResources } from '@/lib/telemetry/active-resources';
import { norseMeter } from '@/lib/telemetry/meter';

import packageJson from '../package.json';

/**
 * Node-runtime telemetry (metrics + logs) for `src/instrumentation.ts`.
 *
 * Everything here imports Node-only packages (`node:os`, the OTLP exporters,
 * runtime/pino instrumentations), so it must only ever be reached through the
 * dynamic `import('./instrumentation.node')` inside `register()` when
 * `NEXT_RUNTIME === 'nodejs'`. The Edge runtime keeps the traces-only path.
 */

/**
 * Latency buckets for `norse.downstream.duration`, copied from the Norse API
 * (`norse_downstream_duration_seconds`) so dashboards can query both services
 * with the same PromQL.
 */
export const DOWNSTREAM_DURATION_BOUNDARIES: number[] = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

export type TelemetrySetupError = {
  /** Which step failed to initialise; logged with the error. */
  signal: 'resource' | 'metrics' | 'logs' | 'node' | 'register';
  error: unknown;
};

/** The subset of `registerOTel()` options built in the Node runtime. */
export type NodeTelemetryConfiguration = Pick<
  Configuration,
  | 'attributes'
  | 'metricReaders'
  | 'views'
  | 'logRecordProcessors'
  | 'instrumentations'
>;

export type NodeTelemetryOptions = {
  configuration: NodeTelemetryConfiguration;
  /** Setup failures. One broken signal must not disable the others. */
  errors: TelemetrySetupError[];
};

export type ResourceAttributeInput = {
  env: Record<string, string | undefined>;
  hostname: string;
  /** Epoch milliseconds at the time attributes are derived. */
  now: number;
  /** `process.uptime()` in seconds. */
  uptimeSeconds: number;
  /** `version` from `package.json`, used when `APP_VERSION` is unset. */
  packageVersion: string;
};

/**
 * Resource attributes shared by traces, metrics and logs. Derived once per
 * process: every instance reports its own `service.instance.id` (the container
 * hostname), which the collector maps to the Prometheus `instance` label.
 */
export function resourceAttributes({
  env,
  hostname,
  now,
  uptimeSeconds,
  packageVersion,
}: ResourceAttributeInput): Attributes {
  // In a container os.hostname() is the pod/container name. Fall back to a
  // random id so a container with no hostname still gets a distinct instance.
  const instanceId = hostname.trim() || randomUUID();

  return {
    'service.instance.id': instanceId,
    'host.name': instanceId,
    'process.creation.time': new Date(now - uptimeSeconds * 1000).toISOString(),
    // The environment is a resource attribute, never part of the service
    // name: prod and dev are the same service, told apart by `env`.
    'deployment.environment.name': env.DEPLOYMENT_ENVIRONMENT || 'production',
    'service.version': env.APP_VERSION || packageVersion,
  };
}

function currentResourceAttributes(): Attributes {
  return resourceAttributes({
    env: process.env,
    hostname: os.hostname(),
    now: Date.now(),
    uptimeSeconds: process.uptime(),
    packageVersion: packageJson.version,
  });
}

/**
 * Explicit buckets for the downstream latency histogram. The default OTel
 * histogram boundaries do not line up with the API's, so the view is required
 * for `norse_downstream_duration_seconds` to be comparable across services.
 */
function downstreamDurationViews(): ViewOptions[] {
  return [
    {
      instrumentName: 'norse.downstream.duration',
      aggregation: {
        type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
        options: { boundaries: DOWNSTREAM_DURATION_BOUNDARIES },
      },
    },
  ];
}

/**
 * Builds the Node-only half of the `registerOTel()` configuration.
 *
 * Called after `register()` has written `OTEL_EXPORTER_OTLP_HEADERS` (the
 * exporters read the environment when they are constructed). Every step is
 * isolated: a failure in one signal is returned in `errors` and the others
 * still start. `OTEL_METRICS_EXPORTER=none` and `OTEL_LOGS_EXPORTER=none`
 * disable that side entirely (used until the collector accepts metrics/logs).
 */
export function createNodeTelemetryOptions(): NodeTelemetryOptions {
  const configuration: NodeTelemetryConfiguration = {};
  const errors: TelemetrySetupError[] = [];
  const instrumentations: NonNullable<Configuration['instrumentations']> = [];

  try {
    configuration.attributes = currentResourceAttributes();
  } catch (error) {
    errors.push({ signal: 'resource', error });
  }

  if (process.env.OTEL_METRICS_EXPORTER !== 'none') {
    try {
      configuration.metricReaders = [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter(),
          exportIntervalMillis: 60_000,
          exportTimeoutMillis: 10_000,
        }),
      ];
      configuration.views = downstreamDurationViews();
      instrumentations.push(
        // Event-loop delay/utilization, GC duration and heap, sampled every
        // 10 ms. Its own 60 s export is the reader above; no timers of ours.
        new RuntimeNodeInstrumentation({ monitoringPrecision: 10 }),
      );
    } catch (error) {
      errors.push({ signal: 'metrics', error });
    }
  }

  if (process.env.OTEL_LOGS_EXPORTER !== 'none') {
    try {
      configuration.logRecordProcessors = [
        new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() }),
      ];
      instrumentations.push(
        // Adds `trace_id`/`span_id`/`trace_flags` to every log line (through
        // pino's mixin) and tees records to the Logs SDK (Loki). Stdout keeps
        // working: the original stream stays in the multistream.
        new PinoInstrumentation({
          disableLogSending: false,
          disableLogCorrelation: false,
        }),
      );
    } catch (error) {
      errors.push({ signal: 'logs', error });
    }
  }

  if (instrumentations.length > 0) {
    configuration.instrumentations = instrumentations;
  }

  return { configuration, errors };
}

let activeResourcesGaugeRegistered = false;

/**
 * Registers the `norse.process.active_resources` observable gauge. Must run
 * after `registerOTel()` installed the meter provider and after
 * `markTelemetryReady()`; the callback runs at collection time (no timer of
 * ours) and reads the active resources then.
 */
export function registerActiveResourcesGauge(): void {
  if (activeResourcesGaugeRegistered) return;

  try {
    norseMeter()
      .createObservableGauge('norse.process.active_resources', {
        description:
          'Active Node resources by type, read when the metric is collected',
      })
      .addCallback((observable) => {
        for (const { type, count } of countActiveResources(
          process.getActiveResourcesInfo(),
        )) {
          observable.observe(count, { type });
        }
      });
    activeResourcesGaugeRegistered = true;
  } catch {
    // Telemetry must never break startup (plan rule 7); retry next register().
  }
}
