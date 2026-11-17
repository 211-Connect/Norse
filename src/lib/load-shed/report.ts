import { lazy } from '@/lib/telemetry/meter';

/**
 * What happens when a load limit answers 429: a metric sample, one warn
 * log per tenant per limit per minute (not one per request), and a `shed`
 * count in the per-crawler stats. Never throws, never awaits on the
 * request path.
 */

export type LoadShedLimit = 'concurrency' | 'minute';

const instruments = lazy((meter) => ({
  shed: meter.createCounter('norse.load_shed', {
    description: 'Requests answered 429 by a per-tenant load limit',
  }),
}));

const lastLogged = new Map<string, number>();
let shedSinceLog = new Map<string, number>();

type CrawlerTrafficModule = typeof import('@/lib/crawler-traffic');
let crawlerTraffic: Promise<CrawlerTrafficModule> | undefined;

/**
 * Loaded on first use: the HTTP hook is installed from `register()`, before
 * telemetry patches pino, so the logger must not be imported at module scope.
 */
function loadCrawlerTraffic(): Promise<CrawlerTrafficModule> {
  crawlerTraffic ??= import('@/lib/crawler-traffic');
  return crawlerTraffic;
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

    void loadCrawlerTraffic()
      .then(({ recordCrawlerTraffic, UNKNOWN_TENANT_ID }) => {
        recordCrawlerTraffic({
          tenantId: tenantId ?? UNKNOWN_TENANT_ID,
          crawler: '',
          outcome: 'shed',
          classification: 'unknown',
        });
        if (logNow) {
          const count = shedSinceLog.get(key) ?? 1;
          shedSinceLog.delete(key);
          return import('@/lib/logger').then(({ createLogger }) => {
            createLogger('load-shed').warn({
              event: 'load_shed',
              limit,
              tenantId: tenant,
              host,
              shedSinceLastLog: count,
            });
          });
        }
      })
      .catch(() => {});

    if (shedSinceLog.size > 1000) shedSinceLog = new Map();
  } catch {
    // Reporting must never break the 429.
  }
}
