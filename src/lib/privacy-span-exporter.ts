import type { Attributes } from '@opentelemetry/api';
import type { ExportResult } from '@opentelemetry/core';
import type {
  ReadableSpan,
  SpanExporter,
  TimedEvent,
} from '@opentelemetry/sdk-trace-base';
import {
  OTLPHttpJsonTraceExporter,
  OTLPHttpProtoTraceExporter,
} from '@vercel/otel';

import { stripQueryAndFragment } from '@/lib/url-privacy';

/**
 * Span attributes whose value is a request URL.
 *
 * Next.js sets `http.target = req.url` on request spans and `@vercel/otel`
 * fetch spans carry `http.url` (some instrumentations use `url.full`). Any of
 * them can hold the search text, the location or the coordinates (privacy
 * rule 8).
 */
const URL_ATTRIBUTES = new Set([
  'http.target',
  'http.url',
  'http.url.full',
  'resource.name',
  'url.full',
]);

/**
 * Next 16.4.2 emits only non-URL `next.*` attributes (`next.route`,
 * `next.span_name`, …) today. Match the URL-shaped names anyway so a Next
 * upgrade cannot silently reintroduce the leak.
 */
const NEXT_URL_ATTRIBUTE = /^next\..*(url|target|uri|href)$/i;

/**
 * A Discord webhook token authorises posting to the channel, and it sits in
 * the path (`/api/webhooks/<id>/<token>`), where query stripping cannot reach
 * it. The placeholder keeps the route recognisable.
 */
const WEBHOOK_PATH = /\/api\/webhooks\/[^/\s?#]+\/[^/\s?#]+/g;
const WEBHOOK_PLACEHOLDER = '/api/webhooks/{id}/{token}';

/** Shared by URL fields and free text: query/fragment first, then tokens. */
function scrubUrlText(value: string): string {
  return stripQueryAndFragment(value).replace(
    WEBHOOK_PATH,
    WEBHOOK_PLACEHOLDER,
  );
}

/**
 * The content of every `IN (...)` / `NOT IN (...)` list, masked whole: for
 * JSON fields Payload writes the values unquoted (`in (bob@example.com)`), so
 * the literal patterns below cannot see them. A subquery without nested
 * parentheses (`in (select ...)`) is masked too; that is the price of safety.
 */
const SQL_IN_LIST = /\b(in\s*\()[^()]*(\))/gi;

/** Attributes that carry SQL text (stable and legacy semconv names). */
const SQL_TEXT_ATTRIBUTES = new Set(['db.query.text', 'db.statement']);

/** `'…'` string literals, including `''` escapes and `E'…'` strings. */
const SQL_STRING_LITERAL = /(?:\b[eE])?'(?:[^']|'')*'/g;

/**
 * Numeric literals that stand alone. `$1` placeholders, identifiers such as
 * `t1` and qualified names such as `s.1x` are left alone.
 */
const SQL_NUMBER_LITERAL = /(?<![\w$.])-?\d+(?:\.\d+)?(?![\w.])/g;

/**
 * Replaces literal values in SQL with `?`, keeping the statement shape.
 *
 * drizzle sends bind parameters (`$1`), but Payload writes some values into
 * the SQL text itself: JSON/richText field queries (`… LIKE '%value%'`) and
 * `IN (…)` lists of relation ids. Those values can be user input (emails,
 * hosts), so they never leave the process (privacy rule 8).
 */
export function maskSqlLiterals(sql: string): string {
  return sql
    .replace(SQL_IN_LIST, '$1?$2')
    .replace(SQL_STRING_LITERAL, "'?'")
    .replace(SQL_NUMBER_LITERAL, '?');
}

/** Fixed status text for a failed Postgres query; see sanitizeStatus. */
export const POSTGRES_ERROR_STATUS = 'postgres error';

function isPostgresSpan(attributes: Attributes): boolean {
  return (
    attributes['db.system.name'] === 'postgresql' ||
    attributes['db.system'] === 'postgresql'
  );
}

function sanitizeAttributes(attributes: Attributes): Attributes {
  const sanitized: Attributes = {};
  const postgres = isPostgresSpan(attributes);
  for (const [key, value] of Object.entries(attributes)) {
    // The query on its own is never needed: drop the key outright.
    if (key === 'url.query') continue;
    if (postgres && SQL_TEXT_ATTRIBUTES.has(key) && typeof value === 'string') {
      sanitized[key] = maskSqlLiterals(value);
      continue;
    }
    sanitized[key] =
      typeof value === 'string' &&
      (URL_ATTRIBUTES.has(key) || NEXT_URL_ATTRIBUTE.test(key))
        ? scrubUrlText(value)
        : value;
  }
  return sanitized;
}

/**
 * Span events carry free-text of their own: `onRequestError` records the error
 * with `recordException`, so `exception.message` and `exception.stacktrace`
 * hold the message verbatim, URL and query string included.
 */
function sanitizeEvent(event: TimedEvent): TimedEvent {
  const attributes: Attributes = {};
  for (const [key, value] of Object.entries(event.attributes ?? {})) {
    attributes[key] = typeof value === 'string' ? scrubUrlText(value) : value;
  }
  return {
    ...event,
    name: scrubUrlText(event.name),
    attributes,
  };
}

/**
 * `@opentelemetry/instrumentation-pg` sets `status.message = err.message`, and
 * Postgres errors echo input (`invalid input syntax for type uuid: "…"`,
 * `invalid input value for enum …: "…"`). The status keeps its code; the
 * message becomes a fixed text. The exception event already carries a
 * sanitised message from the instrumentation.
 */
function sanitizeStatus(span: ReadableSpan): ReadableSpan['status'] {
  const { status } = span;
  if (!status?.message || !isPostgresSpan(span.attributes)) return status;
  return { ...status, message: POSTGRES_ERROR_STATUS };
}

function sanitizeSpan(span: ReadableSpan): ReadableSpan {
  return {
    ...span,
    name: scrubUrlText(span.name),
    status: sanitizeStatus(span),
    attributes: sanitizeAttributes(span.attributes),
    events: span.events.map(sanitizeEvent),
    // Dropped counts are not getters today, but they describe the payload and
    // must survive the copy that replaces the span.
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount,
    // Getters and methods live on the prototype, so spreading the span drops
    // them; delegate them to the recorded span.
    spanContext: () => span.spanContext(),
    duration: span.duration,
    ended: span.ended,
  };
}

/**
 * Exporter decorator: removes query strings and fragments from every span the
 * SDK exports. The Alloy `privacy` transform is the production backstop, but
 * the app must not depend on it — pointing `OTEL_EXPORTER_OTLP_ENDPOINT`
 * straight at Tempo bypasses it, and the local stack has no equivalent
 * (privacy rule 8).
 */
export class PrivacySpanExporter implements SpanExporter {
  constructor(private readonly delegate: SpanExporter) {}

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    this.delegate.export(spans.map(sanitizeSpan), resultCallback);
  }

  shutdown(): Promise<void> {
    return this.delegate.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.delegate.forceFlush?.() ?? Promise.resolve();
  }
}

const DEFAULT_TRACE_URL = 'http://localhost:4318/v1/traces';

/**
 * `key=value,key2=value2`, values URL-encoded, per the OTel spec.
 */
function parseHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const pair of (value ?? '').split(',')) {
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    const key = pair.slice(0, separator).trim();
    if (!key) continue;
    const raw = pair.slice(separator + 1).trim();
    try {
      headers[key] = decodeURIComponent(raw);
    } catch {
      headers[key] = raw;
    }
  }
  return headers;
}

/**
 * Builds the OTLP trace exporter `@vercel/otel`'s own "auto" span processor
 * would build from the environment (2.1.3), so it can be wrapped in
 * `PrivacySpanExporter`. Keep this in step with that package: it reads the
 * endpoint, the headers and the protocol from the same variables.
 */
export function createOtlpTraceExporter(): SpanExporter {
  const url =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
      : DEFAULT_TRACE_URL);
  const headers = {
    ...parseHeaders(process.env.OTEL_EXPORTER_OTLP_HEADERS),
    ...parseHeaders(process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS),
  };
  const protocol =
    process.env.OTEL_EXPORTER_OTLP_TRACES_PROTOCOL ||
    process.env.OTEL_EXPORTER_OTLP_PROTOCOL;

  if (protocol === 'http/json') {
    return new OTLPHttpJsonTraceExporter({ url, headers });
  }
  return new OTLPHttpProtoTraceExporter({ url, headers });
}
