import { context, propagation } from '@opentelemetry/api';

import type { Dependency } from './dependency';

/**
 * `@vercel/otel` reads these per-call options off the fetch init to name and
 * attribute its span. Support is not in the DOM `RequestInit` type, so the
 * field is declared here instead of casting at each call site.
 */
export interface FetchSpanOptions {
  spanName?: string;
  attributes?: Record<string, string>;
}

export type FetchInitWithTelemetry = RequestInit & {
  opentelemetry?: FetchSpanOptions;
};

export interface UrlParts {
  host: string;
  origin: string;
  pathname: string;
}

/**
 * Splits a URL without ever returning the query string or fragment (privacy
 * rule 8: no search text, coordinates or secrets in telemetry).
 */
export function urlParts(url: string): UrlParts {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.host,
      origin: parsed.origin,
      pathname: parsed.pathname,
    };
  } catch {
    return { host: '', origin: '', pathname: url.split(/[?#]/)[0] };
  }
}

/**
 * Span options that keep query strings out of the span name and `http.url`,
 * while naming the span after the stable path template when one is known.
 *
 * Norse API paths are ours and the template strips their IDs, so the path is
 * kept. A third-party path can carry ids and secrets (a Discord webhook token
 * lives in `/api/webhooks/<id>/<token>`), so only the origin is exported.
 * `resource.name` is always set: `@vercel/otel` spreads these attributes last
 * and would otherwise name the span-metric series after the full URL.
 */
export function spanOptionsFor(
  url: string,
  method: string,
  dependency: Dependency,
  pathTemplate?: string,
): Pick<FetchInitWithTelemetry, 'opentelemetry'> {
  const { host, origin, pathname } = urlParts(url);
  const upperMethod = method.toUpperCase();

  if (dependency !== 'norse_api') {
    return {
      opentelemetry: {
        spanName: `fetch ${upperMethod} ${host}`,
        attributes: { 'http.url': origin, 'resource.name': origin },
      },
    };
  }

  const path = pathTemplate ?? pathname;
  return {
    opentelemetry: {
      spanName: `fetch ${upperMethod} ${host}${path}`,
      attributes: {
        'http.url': `${origin}${pathname}`,
        'resource.name': `${origin}${path}`,
      },
    },
  };
}

/**
 * Injects a `traceparent` for Norse API calls that do not have one yet.
 * `@vercel/otel` only injects for sampled spans, so unsampled requests would
 * reach norse-api as a new root; the global propagator writes the `-00`
 * (unsampled) flag. A header already present is never overwritten.
 */
export function injectTraceparent(
  headers: Headers,
  dependency: Dependency,
): void {
  if (dependency !== 'norse_api') return;
  if (headers.has('traceparent')) return;
  propagation.inject(context.active(), headers, {
    set: (carrier, key, value) => carrier.set(key, value),
  });
}
