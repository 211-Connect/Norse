import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

// typeof window === 'undefined' is statically evaluated by bundlers:
// - On the server it's true  → full pino with serializers; pretty stream in dev
// - In the browser bundle it's false → pino/browser (routes to console.*), no stream
const isServer = typeof window === 'undefined';

// pino.transport() spawns a worker thread and breaks Next.js module resolution.
// Importing pino-pretty directly and calling it as a stream is synchronous (same
// thread) and works correctly inside Next.js dev server.
const stream =
  isServer && isDev
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

export const logger = pino(
  {
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    ...(isServer && {
      serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
      },
      base: { env: process.env.NODE_ENV },
    }),
  },
  stream,
);

export function createLogger(module: string): pino.Logger {
  return logger.child({ module });
}
