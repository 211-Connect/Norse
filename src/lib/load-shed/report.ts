import { lazy } from '@/lib/telemetry/meter';

/**
 * What happens when a load limit answers 429: a metric sample and one warn
 * log per tenant per limit per minute (not one per request). Never throws,
 * never awaits on the request path.
 */

export type LoadShedLimit = 'concurrency' | 'minute';

const instruments = lazy((meter) => ({
  shed: meter.createCounter('norse.load_shed', {
    description: 'Requests answered 429 by a per-tenant load limit',
  }),
}));

const lastLogged = new Map<string, number>();
let shedSinceLog = new Map<string, number>();

type LoggerModule = typeof import('@/lib/logger');
let logger: Promise<LoggerModule> | undefined;

/**
 * Loaded on first use: the HTTP hook is installed from `register()`, before
 * telemetry patches pino, so the logger must not be imported at module scope.
 */
function loadLogger(): Promise<LoggerModule> {
  logger ??= import('@/lib/logger');
  return logger;
}

export function reportLoadShed(
  limit: LoadShedLimit,
  tenantId: string | undefined,
  host: string,
): void {
  try {
    const tenant = tenantId ?? 'unknown';
    instruments().shed.add(1, { limit, tenant });

    const key = `${limit}|${tenant}`;
    shedSinceLog.set(key, (shedSinceLog.get(key) ?? 0) + 1);
    const minute = Math.floor(Date.now() / 60_000);
    const logNow = lastLogged.get(key) !== minute;
    if (logNow) lastLogged.set(key, minute);

    if (logNow) {
      const count = shedSinceLog.get(key) ?? 1;
      shedSinceLog.delete(key);
      void loadLogger()
        .then(({ createLogger }) => {
          createLogger('load-shed').warn({
            event: 'load_shed',
            limit,
            tenantId: tenant,
            host,
            shedSinceLastLog: count,
          });
        })
        .catch(() => {});
    }

    if (shedSinceLog.size > 1000) shedSinceLog = new Map();
  } catch {
    // Reporting must never break the 429.
  }
}
