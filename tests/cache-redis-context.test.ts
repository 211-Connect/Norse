import {
  type Context,
  ROOT_CONTEXT,
  context,
  createContextKey,
} from '@opentelemetry/api';
import { Redis } from 'ioredis';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import net from 'node:net';
import { after, before, describe, test } from 'node:test';

const REQUEST = createContextKey('test request');

/**
 * Just enough RESP for ioredis to connect, pass the ready check and run the
 * commands `isHealthy()` sends. `dropAll()` closes every client socket, the
 * way a managed Valkey closes idle connections.
 */
function startFakeRedis(): Promise<{
  url: string;
  dropAll: () => void;
  close: () => Promise<void>;
}> {
  const sockets = new Set<net.Socket>();
  const store = new Map<string, string>();

  const reply = (command: string[]): string => {
    const [name = '', ...args] = command;
    switch (name.toUpperCase()) {
      case 'INFO': {
        const info = 'redis_version:7.2.0\r\nloading:0\r\n';
        return `$${Buffer.byteLength(info)}\r\n${info}\r\n`;
      }
      case 'PING':
        return '+PONG\r\n';
      case 'SETEX':
        store.set(args[0], args[2]);
        return '+OK\r\n';
      case 'GET': {
        const value = store.get(args[0]);
        return value === undefined
          ? '$-1\r\n'
          : `$${Buffer.byteLength(value)}\r\n${value}\r\n`;
      }
      case 'DEL':
        return `:${store.delete(args[0]) ? 1 : 0}\r\n`;
      default:
        // CLIENT SETINFO / SETNAME, SELECT, ...
        return '+OK\r\n';
    }
  };

  /** Parses complete `*<n>\r\n$<len>\r\n<arg>\r\n...` arrays off the buffer. */
  const parse = (buffer: string): { commands: string[][]; rest: string } => {
    const commands: string[][] = [];
    let offset = 0;
    for (;;) {
      if (buffer[offset] !== '*') break;
      const headerEnd = buffer.indexOf('\r\n', offset);
      if (headerEnd === -1) break;
      const count = Number(buffer.slice(offset + 1, headerEnd));
      let cursor = headerEnd + 2;
      const command: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const lengthEnd = buffer.indexOf('\r\n', cursor);
        if (lengthEnd === -1) break;
        const length = Number(buffer.slice(cursor + 1, lengthEnd));
        const start = lengthEnd + 2;
        if (buffer.length < start + length + 2) break;
        command.push(buffer.slice(start, start + length));
        cursor = start + length + 2;
      }
      if (command.length !== count) break;
      commands.push(command);
      offset = cursor;
    }
    return { commands, rest: buffer.slice(offset) };
  };

  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    let pending = '';
    socket.on('data', (chunk) => {
      const { commands, rest } = parse(pending + chunk.toString('utf8'));
      pending = rest;
      for (const command of commands) socket.write(reply(command));
    });
  });

  return new Promise((resolve, reject) => {
    // EPERM in a sandbox, EADDRINUSE: fail the hook instead of hanging.
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as net.AddressInfo;
      resolve({
        url: `redis://127.0.0.1:${port}`,
        dropAll: () => {
          for (const socket of sockets) socket.destroy();
        },
        close: () =>
          new Promise<void>((done) => {
            for (const socket of sockets) socket.destroy();
            server.close(() => done());
          }),
      });
    });
  });
}

/** Resolves with the active context the next time `client` reconnects. */
function contextOfNextReconnect(client: Redis): Promise<Context> {
  return new Promise((resolve) => {
    client.once('reconnecting', () => resolve(context.active()));
  });
}

// A failed listen or a missing `reconnecting` event must fail, not hang.
const TIMEOUT = { timeout: 10_000 };

let fakeRedis: Awaited<ReturnType<typeof startFakeRedis>>;

before(async () => {
  const storage = new AsyncLocalStorage<Context>();
  context.setGlobalContextManager({
    active: () => storage.getStore() ?? ROOT_CONTEXT,
    with: (ctx, fn, thisArg, ...args) =>
      storage.run(ctx, () => fn.apply(thisArg, args)),
    bind: (_ctx, target) => target,
    enable() {
      return this;
    },
    disable() {
      return this;
    },
  });
  fakeRedis = await startFakeRedis();
}, TIMEOUT);

after(async () => {
  await fakeRedis.close();
  context.disable();
});

describe(
  'Redis reconnects do not join the request that created the client',
  TIMEOUT,
  () => {
    test('control: a client connected inside a request reconnects in that request', async () => {
      // Pins the mechanism the fix relies on: without ROOT_CONTEXT the socket
      // keeps the creating request's context, so this would be the bug.
      const client = new Redis(fakeRedis.url, {
        lazyConnect: true,
        retryStrategy: () => 50,
      });
      try {
        await context.with(ROOT_CONTEXT.setValue(REQUEST, 'first'), () =>
          client.connect(),
        );
        const reconnect = contextOfNextReconnect(client);
        fakeRedis.dropAll();
        assert.equal((await reconnect).getValue(REQUEST), 'first');
      } finally {
        client.disconnect();
      }
    });

    test('CacheService reconnects outside any request context', async () => {
      process.env.CACHE_REDIS_URI = fakeRedis.url;
      const { CacheService } = await import('../src/cacheService');
      const service = new CacheService(0);
      try {
        const healthy = await context.with(
          ROOT_CONTEXT.setValue(REQUEST, 'first'),
          async () => {
            const ok = await service.isHealthy();
            // The caller keeps its own context after awaiting the connect.
            assert.equal(context.active().getValue(REQUEST), 'first');
            return ok;
          },
        );
        assert.equal(healthy, true);

        const client = service.getClient();
        assert.ok(client, 'isHealthy() must have created the client');
        const reconnect = contextOfNextReconnect(client);
        fakeRedis.dropAll();
        assert.equal(
          (await reconnect).getValue(REQUEST),
          undefined,
          'the reconnect must not run in the context of the first request',
        );
      } finally {
        service.getClient()?.disconnect();
        delete process.env.CACHE_REDIS_URI;
      }
    });
  },
);
