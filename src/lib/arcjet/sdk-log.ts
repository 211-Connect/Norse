import { format } from 'node:util';

/**
 * The `log` passed to `arcjet({ log })`. Without it the SDK writes to the
 * console. Here:
 * - `debug` and `info` go to OTel Logs only (scope `arcjet-sdk`), never stdout;
 * - `warn` and `error` go to pino (stdout and OTLP).
 * Levels below `ARCJET_LOG_LEVEL` (default `warn`) are dropped.
 *
 * The SDK calls both forms: format strings (`"LATENCY %s: %sms", a, b`) and
 * object-first (`{ ... }, "message", ...args`).
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<string, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

export interface SdkLogSinks {
  otel: (
    level: 'debug' | 'info',
    message: string,
    attributes: Record<string, unknown>,
  ) => void;
  pino: (
    level: 'warn' | 'error',
    data: Record<string, unknown>,
    message: string,
  ) => void;
}

export interface ArcjetSdkLogger {
  debug(msg: unknown, ...args: unknown[]): void;
  info(msg: unknown, ...args: unknown[]): void;
  warn(msg: unknown, ...args: unknown[]): void;
  error(msg: unknown, ...args: unknown[]): void;
}

/** Splits either call form into a message and an attribute object. */
export function parseSdkLogCall(
  first: unknown,
  rest: unknown[],
): { message: string; data: Record<string, unknown> } {
  if (typeof first === 'string') {
    return { message: format(first, ...rest), data: {} };
  }
  const data =
    first && typeof first === 'object'
      ? { ...(first as Record<string, unknown>) }
      : { value: first };
  const [msg, ...args] = rest;
  return {
    message: typeof msg === 'string' ? format(msg, ...args) : '',
    data,
  };
}

export function createArcjetSdkLogger(
  sinks: SdkLogSinks,
  levelName: string | undefined = process.env.ARCJET_LOG_LEVEL,
): ArcjetSdkLogger {
  const min = LEVELS[(levelName ?? 'warn').toLowerCase()] ?? LEVELS.warn;
  const at =
    (level: Level) =>
    (first: unknown, ...rest: unknown[]) => {
      try {
        if (LEVELS[level] < min) return;
        const { message, data } = parseSdkLogCall(first, rest);
        if (level === 'debug' || level === 'info') {
          sinks.otel(level, message, data);
        } else {
          sinks.pino(level, { event: 'arcjet_sdk', ...data }, message);
        }
      } catch {
        // Logging must never break a request.
      }
    };
  return {
    debug: at('debug'),
    info: at('info'),
    warn: at('warn'),
    error: at('error'),
  };
}
