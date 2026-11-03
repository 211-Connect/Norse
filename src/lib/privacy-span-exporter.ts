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
  'url.full',
]);

/**
 * Next 16.4.2 emits only non-URL `next.*` attributes (`next.route`,
 * `next.span_name`, …) today. Match the URL-shaped names anyway so a Next
 * upgrade cannot silently reintroduce the leak.
 */
const NEXT_URL_ATTRIBUTE = /^next\..*(url|target|uri|href)$/i;

function sanitizeAttributes(attributes: Attributes): Attributes {
  const sanitized: Attributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    // The query on its own is never needed: drop the key outright.
    if (key === 'url.query') continue;
    sanitized[key] =
      typeof value === 'string' &&
      (URL_ATTRIBUTES.has(key) || NEXT_URL_ATTRIBUTE.test(key))
        ? stripQueryAndFragment(value)
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
    attributes[key] =
      typeof value === 'string' ? stripQueryAndFragment(value) : value;
  }
  return {
    ...event,
    name: stripQueryAndFragment(event.name),
    attributes,
  };
}

function sanitizeSpan(span: ReadableSpan): ReadableSpan {
  return {
    ...span,
    name: stripQueryAndFragment(span.name),
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
