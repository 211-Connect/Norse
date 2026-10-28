import { trace } from '@opentelemetry/api';

import { FetchError } from './fetchError';

/**
 * Parsing a response is on-thread work: a 1 MB search response is a few
 * hundred milliseconds of `JSON.parse` during which nothing else runs
 * (ISS-1739). The fetch span covers the network wait; this span covers the
 * parse, with the byte count, so service time can be read by payload size.
 * The URL path only, never the query string. Tracer resolved per call: the
 * provider is registered by `register()` after this module may have loaded.
 */
async function parseJson<T>(response: Response, url: string): Promise<T> {
  const text = await response.text();
  const { host, pathname } = safeUrl(url);
  return trace.getTracer('norse-app').startActiveSpan(
    'response.parse',
    {
      attributes: {
        'response.parse.bytes': text.length,
        'server.address': host,
        'url.path': pathname,
      },
    },
    (span) => {
      try {
        return JSON.parse(text) as T;
      } finally {
        span.end();
      }
    },
  );
}

function safeUrl(url: string): { host: string; pathname: string } {
  try {
    const u = new URL(url);
    return { host: u.host, pathname: u.pathname };
  } catch {
    return { host: '', pathname: '' };
  }
}

interface FetchWrapperOptions extends Omit<RequestInit, 'body'> {
  parseResponse?: boolean;
  body?: any; // Can accept any object, will be stringified automatically
}

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

  return body;
};

export async function fetchWrapper<T = any>(
  url: string,
  options: FetchWrapperOptions = {},
): Promise<T | null> {
  const { parseResponse = true, body, ...fetchOptions } = options;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      body: toBody(body),
    });

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

    return await parseJson<T>(response, url);
  } catch (err) {
    if (!(err instanceof FetchError)) {
      // Handle unexpected errors (network errors, JSON parsing errors, JSON.stringify errors, etc.)
      return null;
    }
    throw err;
  }
}
