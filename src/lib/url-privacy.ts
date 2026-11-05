/**
 * URL sanitiser shared by the pino logger and the span exporter (privacy
 * rule 8).
 *
 * This module has no imports on purpose: `privacy-span-exporter.ts` is
 * instantiated before `registerOTel()`, and `@/lib/logger` creates its pino
 * instance (and its pino-pretty destination) as soon as it is evaluated. A
 * pino module loaded before the instrumentation is enabled cannot be patched,
 * so the app would lose `trace_id`/`span_id` on log lines and the OTLP log
 * records (N3). Keep this module dependency-free.
 */

/**
 * Drops a query string and fragment: everything from the first `?` or `#`.
 *
 * For fields known to hold a URL or path (span names, `http.target`,
 * `url.full`, …) the first `?` is always the query delimiter. Free text needs
 * `stripUrlQueries` instead, where a bare `?` can be prose.
 */
export function stripQueryAndFragment(value: string): string {
  const cut = value.search(/[?#]/);
  return cut === -1 ? value : value.slice(0, cut);
}
