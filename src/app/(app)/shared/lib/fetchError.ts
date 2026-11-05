/**
 * Error thrown by `fetchWrapper` for a non-2xx response.
 *
 * Privacy (hard rule 8; 211 is a crisis-services directory): the failing
 * request URL is reduced to `origin + pathname` at construction time. Query
 * strings and fragments carry search text, location, coordinates, filters and
 * API keys, so they must never reach the message, `response.url` or a log.
 */

export interface FetchErrorResponse {
  /** `origin + pathname` of the failing request — never a query string. */
  url: string;
  status: number;
  statusText: string;
  data?: any;
}

export interface FetchErrorInit {
  url: string;
  status: number;
  statusText: string;
  data?: any;
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}

export class FetchError extends Error {
  /**
   * Declared for typing only; installed as a non-enumerable property below.
   * pino's `stdSerializers.err` prints every own enumerable property, and
   * neither the upstream URL with its query string nor the upstream response
   * body may end up in a log line.
   */
  declare readonly response: FetchErrorResponse;

  constructor(init: FetchErrorInit) {
    const url = sanitizeUrl(init.url);
    super(`HTTP error! status: ${init.status} ${init.statusText} (${url})`);
    this.name = 'FetchError';

    Object.defineProperty(this, 'response', {
      value: {
        url,
        status: init.status,
        statusText: init.statusText,
        data: init.data,
      },
      enumerable: false,
      writable: false,
      configurable: true,
    });
  }
}
