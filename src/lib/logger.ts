import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

// typeof window === 'undefined' is statically evaluated by bundlers:
// - On the server it's true  → full pino with serializers; pretty stream in dev
// - In the browser bundle it's false → pino/browser (routes to console.*), no stream
const isServer = typeof window === 'undefined';

// pino.transport() spawns a worker thread and breaks Next.js module resolution.
// Importing pino-pretty directly and calling it as a stream is synchronous (same
// thread) and works correctly inside Next.js dev server.
//
// require() is available in CJS (Next.js compiled server code) but not in native
// ESM (e.g. the payload CLI). `typeof require` returns 'undefined' in ESM without
// throwing, so this guard makes the stream optional when require is unavailable.
const stream =
  isServer && isDev && typeof require === 'function'
    ? require('pino-pretty')({
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,env',
        messageKey: 'msg',
        errorLikeObjectKeys: ['err', 'error'],
      })
    : undefined;

// NEXT_PUBLIC_LOG_LEVEL is used in all environments:
// - Server / Edge: still readable as a regular env var (Node.js sees all vars)
// - Browser: inlined at build time by Next.js (only NEXT_PUBLIC_* vars are bundled)
const logLevel =
  process.env.NEXT_PUBLIC_LOG_LEVEL ?? (isDev ? 'debug' : 'info');

/**
 * Matches a whitespace-delimited token carrying a query string or fragment
 * inside free text (`message`, `stack`, …). Wider than an absolute-URL match
 * because a relative URL leaks the same search text: Next.js errors and
 * `redirect()` calls carry `/search?query=…`, and libraries build
 * `search?q=…` without a scheme.
 */
const TOKEN_WITH_QUERY = /[^\s"'<>)]*[?#][^\s"'<>)]*/g;

/**
 * A bare `?` is often prose ("did it fail?"), so only drop the query of a token
 * that is URL-shaped: a `/` precedes it (`/search?…`, `https://host/a?…`) or
 * it is `key=value` shaped, which is what a bare relative reference such as
 * `search?q=…` looks like.
 */
function stripTokenQuery(token: string): string {
  const cut = token.search(/[?#]/);
  if (cut === -1) return token;
  const path = token.slice(0, cut);
  const query = token.slice(cut + 1);
  return path.includes('/') || /^[^\s=&]+=/.test(query) ? path : token;
}

/**
 * Drops the query string and fragment from every URL in `value` — absolute or
 * relative (`/search?query=…`, `search?q=…`).
 *
 * Second barrier behind `FetchError`'s already-sanitised URL: an error raised
 * by a library, a raw `Response`, or a hand-built message can still embed a
 * complete request URL, and Loki must never receive search text, location,
 * coordinates, filters or API keys (privacy rule 8).
 */
export function stripUrlQueries(value: string): string {
  return value.replace(TOKEN_WITH_QUERY, stripTokenQuery);
}

function sanitizeTextField(value: unknown): unknown {
  return typeof value === 'string' ? stripUrlQueries(value) : value;
}

/**
 * `pino.stdSerializers.err` plus URL sanitisation for every field an error can
 * carry: `message`, `stack`, `url` and `response.url`.
 */
function errorSerializer(error: unknown): unknown {
  const serialized =
    error instanceof Error
      ? (pino.stdSerializers.err(error) as Record<string, unknown>)
      : error;

  if (!serialized || typeof serialized !== 'object') {
    return serialized;
  }

  const out: Record<string, unknown> = {
    ...(serialized as Record<string, unknown>),
  };
  for (const key of ['message', 'stack', 'url']) {
    out[key] = sanitizeTextField(out[key]);
  }

  const response = out.response;
  if (response && typeof response === 'object') {
    const sanitizedResponse: Record<string, unknown> = {
      ...(response as Record<string, unknown>),
    };
    sanitizedResponse.url = sanitizeTextField(sanitizedResponse.url);
    out.response = sanitizedResponse;
  }

  return out;
}

const loggerOptions: pino.LoggerOptions = {
  level: logLevel,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  ...(isServer && {
    serializers: {
      err: errorSerializer,
      error: errorSerializer,
    },
    base: { env: process.env.NODE_ENV },
  }),
};

let logger: pino.Logger = pino(loggerOptions, stream);

/**
 * Test-only seam: rebuilds the singleton logger on another destination so a
 * test can assert the serialized line (serializers included) instead of
 * writing to stdout. Call it before importing modules that call
 * `createLogger`, because those keep a child of the logger that exists then.
 */
export function setLogDestination(
  destination?: pino.DestinationStream,
): Logger {
  logger = pino(loggerOptions, destination ?? stream);
  return logger;
}

/**
 * The server logger type. Consumers annotate with this name instead of a
 * structural type derived from `createLogger`, so the contract lives here.
 */
export type Logger = pino.Logger;

export function createLogger(module: string): Logger {
  return logger.child({ module });
}
