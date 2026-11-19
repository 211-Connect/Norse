import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

/**
 * `privacy-span-exporter.ts` is instantiated before `registerOTel()`, so
 * nothing it imports may evaluate `src/lib/logger.ts`: that module creates its
 * pino instance (and its pino-pretty destination) at module scope, and
 * `@opentelemetry/instrumentation-pino` can only patch a pino module loaded
 * after the instrumentation is enabled (N3). This test records the module graph
 * the importer pulls in, which is why the import stays dynamic: a static import
 * is evaluated before `registerHooks()` can observe it.
 */
test('importing the span exporter does not evaluate the pino logger', async () => {
  const resolved: string[] = [];
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const result = nextResolve(specifier, context);
      resolved.push(result.url);
      return result;
    },
  });

  try {
    await import('../src/lib/privacy-span-exporter');
  } finally {
    hooks.deregister();
  }

  assert.ok(
    resolved.some((url) => url.endsWith('/src/lib/privacy-span-exporter.ts')),
    'expected the resolve hook to observe the exporter import',
  );

  const loggerModules = resolved.filter(
    (url) =>
      url.includes('/src/lib/logger') ||
      url.includes('/node_modules/pino/') ||
      url.includes('/node_modules/pino-pretty/'),
  );
  assert.deepEqual(loggerModules, []);
});
