import { type Exception, SpanStatusCode, trace } from '@opentelemetry/api';

import {
  type Dependency,
  type Operation,
  type Outcome,
  classifyStatus,
  isTimeoutError,
  recordDependency,
  recordResponseParseSize,
  toOperation,
} from '@/lib/telemetry/dependency';
import {
  injectTraceparent,
  spanOptionsFor,
  urlParts,
} from '@/lib/telemetry/fetch';

import { FetchError } from './fetchError';

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: unknown; // Object bodies are stringified automatically
  telemetry?: { dependency: Dependency; operation: Operation };
}

const tracer = trace.getTracer('norse-app');

const toBody = (body: FetchWrapperOptions['body']) => {
  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof FormData) {
    return body;
  }

  if (body && typeof body === 'object') {
    return JSON.stringify(body);
  }

  // Remaining values are primitives (or null) accepted by fetch as-is.
  return body as BodyInit | null | undefined;
};

/**
 * `JSON.parse` messages embed a body excerpt in quotes
 * (`Unexpected token '<', "<html>…" is not valid JSON`). The response body is
 * untrusted content, so only the error name and the text before the first
 * quote are recorded: the type of failure, never the body.
 */
function jsonParseException(error: unknown): Exception {
  const name = error instanceof Error && error.name ? error.name : 'Error';
  const raw = error instanceof Error ? error.message : '';
  const message =
    raw.split(/['"]/)[0].trim().slice(0, 120) || 'JSON parse failed';
  return { name, message };
}

export async function fetchWrapper<T = any>(
  url: string,
  options: FetchWrapperOptions = {},
): Promise<T | null> {
  const { parseResponse = true, body, telemetry, ...fetchOptions } = options;
  const dependency = telemetry?.dependency ?? 'other';
  const operation = toOperation(
    dependency,
    telemetry?.operation ?? 'other',
  );
  const method = (fetchOptions.method ?? 'GET').toString().toUpperCase();

  const headers = new Headers(fetchOptions.headers);
  injectTraceparent(headers, dependency);

  const start = performance.now();
  let outcome: Outcome = 'error';

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      ...spanOptionsFor(url, method),
      headers,
      body: toBody(body),
    });

    outcome = classifyStatus(dependency, operation, response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = undefined;
      }
      throw new FetchError({
        status: response.status,
        statusText: response.statusText,
        data: errorData,
        url,
      });
    }

    if (!parseResponse) {
      return response as T;
    }

    const text = await response.text();
    const { host, pathname } = urlParts(url);
    // `Buffer` exists in the Node runtime this wrapper normally runs in; the
    // two client-side callers (error boundary, SMS button) must not crash.
    const bytes =
      typeof Buffer === 'undefined'
        ? new TextEncoder().encode(text).byteLength
        : Buffer.byteLength(text);
    recordResponseParseSize(dependency, operation, bytes);

    const data = await tracer.startActiveSpan(
      'response.parse',
      {
        attributes: {
          'response.body.size': bytes,
          'server.address': host,
          'url.path': pathname,
        },
      },
      (span) => {
        try {
          return JSON.parse(text) as T;
        } catch (error) {
          span.recordException(jsonParseException(error));
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw error;
        } finally {
          span.end();
        }
      },
    );
    return data;
  } catch (err) {
    if (err instanceof FetchError) {
      throw err;
    }
    // Handle unexpected errors (network errors, JSON parsing errors,
    // JSON.stringify errors, etc.). Classify here, before they become `null`.
    outcome = isTimeoutError(err) ? 'timeout' : 'error';
    return null;
  } finally {
    recordDependency(
      dependency,
      operation,
      outcome,
      (performance.now() - start) / 1000,
    );
  }
}
