import {
  type AnyValueMap,
  logs,
  SeverityNumber,
} from '@opentelemetry/api-logs';

/**
 * The `arcjet_decision` record: one OTel log record per logged Arcjet
 * decision, sent through the OTel Logs API only (OTLP → Loki), never pino or
 * stdout, so the App Platform console stays readable.
 *
 * Emit it inside the `arcjet.protect` span: the Logs SDK then attaches that
 * span's `trace_id`, `span_id` and `flags` (`1` = trace stored in Tempo),
 * which Grafana uses to link Loki → Tempo. Fields are flat snake_case; see
 * docs/observability.md ("arcjet_decision").
 *
 * No-op when `OTEL_LOGS_EXPORTER=none` (or before the logger provider is
 * installed: the API's no-op logger). Never throws.
 */

export const ARCJET_DECISION_EVENT = 'arcjet_decision';
const LOGGER_NAME = 'norse-app.arcjet';

export type DecisionFieldValue =
  string | number | boolean | string[] | undefined;

export type DecisionRecord = Record<string, DecisionFieldValue>;

/** Test seam: where records go instead of the global logger. */
type Emit = (record: {
  body: string;
  severityNumber: SeverityNumber;
  severityText: string;
  attributes: AnyValueMap;
}) => void;

let emitOverride: Emit | undefined;

export function setDecisionLogEmitter(emit: Emit | undefined): void {
  emitOverride = emit;
}

function logsDisabled(): boolean {
  return process.env.OTEL_LOGS_EXPORTER === 'none';
}

const SEVERITY: Record<string, [SeverityNumber, string]> = {
  ERROR: [SeverityNumber.WARN, 'WARN'],
  THREW: [SeverityNumber.WARN, 'WARN'],
};

/** Emits one `arcjet_decision` record. Never throws. */
export function emitArcjetDecision(record: DecisionRecord): void {
  try {
    if (!emitOverride && logsDisabled()) return;
    const attributes: AnyValueMap = { event: ARCJET_DECISION_EVENT };
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined) continue;
      attributes[key] = Array.isArray(value) ? value.join(',') : value;
    }
    const [severityNumber, severityText] = SEVERITY[
      String(record.conclusion)
    ] ?? [SeverityNumber.INFO, 'INFO'];
    const out = {
      body: ARCJET_DECISION_EVENT,
      severityNumber,
      severityText,
      attributes,
    };
    if (emitOverride) emitOverride(out);
    else logs.getLogger(LOGGER_NAME).emit(out);
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}

/**
 * OTel-only logger for the Arcjet SDK's debug/info output (scope
 * `arcjet-sdk`). Never throws.
 */
export function emitArcjetSdkLog(
  level: 'debug' | 'info',
  message: string,
  attributes: Record<string, unknown> = {},
): void {
  try {
    if (logsDisabled()) return;
    const attrs: AnyValueMap = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        attrs[key] = value;
      }
    }
    logs.getLogger('arcjet-sdk').emit({
      body: message,
      severityNumber:
        level === 'debug' ? SeverityNumber.DEBUG : SeverityNumber.INFO,
      severityText: level.toUpperCase(),
      attributes: attrs,
    });
  } catch {
    // Telemetry must never break a request (plan rule 7).
  }
}
