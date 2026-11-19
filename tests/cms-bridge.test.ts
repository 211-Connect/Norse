import {
  type Context,
  ROOT_CONTEXT,
  TraceFlags,
  context,
  propagation,
  trace,
} from '@opentelemetry/api';
import assert from 'node:assert/strict';
import { AsyncLocalStorage } from 'node:async_hooks';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, before, beforeEach, describe, test } from 'node:test';

import { InjectOnlyTraceContextPropagator } from '../src/instrumentation';
import { CmsRequestError, cmsRequest } from '../src/lib/cms/client';
import { isCmsRemote } from '../src/lib/cms/config';
import { internalRoute } from '../src/lib/cms/internal-route';

const KEY = 'test-internal-key-not-a-real-secret';
const ENV_NAMES = ['NORSE_ROLE', 'PAYLOAD_CMS_URL', 'PAYLOAD_API_ROUTE_SECRET'];
let savedEnv: Record<string, string | undefined>;

const TRACE_ID = 'd5d66db15abc6640c0148371e2ce7d18';
const SPAN_ID = '9092161788c27f33';

before(() => {
  // The app's propagator and a real async context, as registerOTel sets up.
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
  propagation.setGlobalPropagator(new InjectOnlyTraceContextPropagator());
});

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_NAMES.map((n) => [n, process.env[n]]));
  for (const name of ENV_NAMES) delete process.env[name];
});

afterEach(() => {
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe('isCmsRemote', () => {
  test('all without a CMS URL reads Payload in process', () => {
    assert.equal(isCmsRemote(), false);
  });

  test('a CMS URL makes the app (and all) read over HTTP', () => {
    process.env.PAYLOAD_CMS_URL = 'https://cms.test';
    assert.equal(isCmsRemote(), true);
    process.env.NORSE_ROLE = 'app';
    assert.equal(isCmsRemote(), true);
  });

  test('the CMS itself never calls over HTTP', () => {
    process.env.NORSE_ROLE = 'cms';
    process.env.PAYLOAD_CMS_URL = 'https://cms.test';
    assert.equal(isCmsRemote(), false);
  });

  test('the app without a CMS URL fails fast', () => {
    process.env.NORSE_ROLE = 'app';
    assert.throws(() => isCmsRemote(), /PAYLOAD_CMS_URL is required/);
  });
});

describe('internalRoute', () => {
  const route = internalRoute(async (request: Request) => {
    const what = new URL(request.url).searchParams.get('what');
    if (what === 'null') return null;
    if (what === 'throw') throw new Error('boom');
    return { ok: true };
  });
  const call = (what: string, key?: string) =>
    route(
      new Request(`http://cms.test/api/internal/x?what=${what}`, {
        headers: key ? { 'x-internal-api-key': key } : {},
      }),
    );

  test('404 in the public app', async () => {
    process.env.NORSE_ROLE = 'app';
    process.env.PAYLOAD_API_ROUTE_SECRET = KEY;
    assert.equal((await call('ok', KEY)).status, 404);
  });

  test('401 without the right key', async () => {
    process.env.PAYLOAD_API_ROUTE_SECRET = KEY;
    assert.equal((await call('ok')).status, 401);
    assert.equal((await call('ok', 'wrong')).status, 401);
  });

  test('401 when the CMS has no key configured', async () => {
    assert.equal((await call('ok', KEY)).status, 401);
  });

  test('answers JSON, null included, and 500 on a throw', async () => {
    process.env.NORSE_ROLE = 'cms';
    process.env.PAYLOAD_API_ROUTE_SECRET = KEY;
    assert.deepEqual(await (await call('ok', KEY)).json(), { ok: true });
    assert.equal(await (await call('null', KEY)).json(), null);
    assert.equal((await call('throw', KEY)).status, 500);
  });
});

describe('cmsRequest', () => {
  let server: Server;
  let seen: {
    url?: string;
    key?: string;
    method?: string;
    body?: string;
    traceparent?: string;
  };

  beforeEach(async () => {
    seen = {};
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        seen = {
          url: req.url,
          key: req.headers['x-internal-api-key'] as string,
          method: req.method,
          body,
          traceparent: req.headers.traceparent as string | undefined,
        };
        if (req.url?.startsWith('/api/internal/forbidden')) {
          res.writeHead(403, { 'content-type': 'text/html' });
          res.end('<html>blocked</html>');
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(req.url?.includes('missing') ? 'null' : '{"id":"t1"}');
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    process.env.PAYLOAD_CMS_URL = `http://127.0.0.1:${port}/`;
    process.env.PAYLOAD_API_ROUTE_SECRET = KEY;
  });

  afterEach(
    () => new Promise<void>((resolve) => server.close(() => resolve())),
  );

  test('sends the key and query, parses the JSON answer', async () => {
    const result = await cmsRequest<{ id: string }>('tenants/by-host', {
      query: { host: 'a.test' },
    });
    assert.deepEqual(result, { id: 't1' });
    assert.equal(seen.url, '/api/internal/tenants/by-host?host=a.test');
    assert.equal(seen.key, KEY);
  });

  test('null is a valid answer', async () => {
    assert.equal(await cmsRequest('tenants/missing'), null);
  });

  test('an unsampled request sends a -00 traceparent', async () => {
    // @vercel/otel injects only for sampled spans; without this the CMS
    // would start its own root and sample it at its own ratio.
    const unsampled = trace.wrapSpanContext({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      traceFlags: TraceFlags.NONE,
    });
    await context.with(trace.setSpan(ROOT_CONTEXT, unsampled), () =>
      cmsRequest('tenants/by-host', { query: { host: 'a.test' } }),
    );
    assert.equal(seen.traceparent, `00-${TRACE_ID}-${SPAN_ID}-00`);
  });

  test('no traceparent outside any trace', async () => {
    await cmsRequest('tenants/by-host', { query: { host: 'a.test' } });
    assert.equal(seen.traceparent, undefined);
  });

  test('POSTs JSON bodies', async () => {
    await cmsRequest('translation-usage/allowance', {
      method: 'POST',
      body: { tenantId: 't1', userEmail: 'a@b.test' },
    });
    assert.equal(seen.method, 'POST');
    assert.deepEqual(JSON.parse(seen.body ?? ''), {
      tenantId: 't1',
      userEmail: 'a@b.test',
    });
  });

  test('throws with the status on an error answer', async () => {
    await assert.rejects(cmsRequest('forbidden'), (error: unknown) => {
      assert.ok(error instanceof CmsRequestError);
      assert.equal(error.status, 403);
      return true;
    });
  });

  test('throws when the key is not configured', async () => {
    delete process.env.PAYLOAD_API_ROUTE_SECRET;
    await assert.rejects(
      cmsRequest('tenants/by-host'),
      /PAYLOAD_API_ROUTE_SECRET/,
    );
  });
});

describe('cmsRequest in a build with trailing slashes (MBOA)', () => {
  let server: Server;
  let seenUrl: string | undefined;

  beforeEach(async () => {
    server = createServer((req, res) => {
      seenUrl = req.url;
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('null');
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    process.env.PAYLOAD_CMS_URL = `http://127.0.0.1:${port}/adresources`;
    process.env.PAYLOAD_API_ROUTE_SECRET = KEY;
    process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES = 'true';
  });

  afterEach(async () => {
    delete process.env.NEXT_PUBLIC_WITH_TRAILING_SLASHES;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('keeps the base path and adds the slash before the query', async () => {
    await cmsRequest('tenants/by-host', { query: { host: 'a.test' } });
    assert.equal(
      seenUrl,
      '/adresources/api/internal/tenants/by-host/?host=a.test',
    );
  });
});
