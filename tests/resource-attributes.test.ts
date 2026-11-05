import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// `.js` lets the Node ESM loader (tsx) resolve the `.node.ts` module; the
// bare specifier is read as the `.node` native-addon extension.
import { resourceAttributes } from '../src/instrumentation.node.js';

/**
 * Resource attributes are shared by traces, metrics and logs. They are what
 * the collector turns into Prometheus' `instance` label and `env` (from
 * `deployment.environment.name`), so the derivations are pinned here.
 */
describe('resourceAttributes', () => {
  it('derives the instance, creation time, environment and version', () => {
    const attributes = resourceAttributes({
      env: {
        DEPLOYMENT_ENVIRONMENT: 'dev',
        // A build-provided version wins over package.json (e.g. the image tag).
        APP_VERSION: '2026.11.2-rc.1',
      },
      hostname: 'norse-app-7c9d4f5b6d-abcde',
      now: 1_700_000_100_000,
      uptimeSeconds: 90,
      packageVersion: '0.1.1',
    });

    assert.equal(
      attributes['service.instance.id'],
      'norse-app-7c9d4f5b6d-abcde',
    );
    assert.equal(attributes['host.name'], 'norse-app-7c9d4f5b6d-abcde');
    // Process start = now - uptime (90 s earlier).
    assert.equal(
      attributes['process.creation.time'],
      new Date(1_700_000_010_000).toISOString(),
    );
    assert.equal(attributes['deployment.environment.name'], 'dev');
    assert.equal(attributes['service.version'], '2026.11.2-rc.1');
  });

  it('defaults an unset environment to unknown and the version to package.json', () => {
    const attributes = resourceAttributes({
      env: {},
      hostname: 'norse-app-1',
      now: 1_700_000_000_000,
      uptimeSeconds: 0,
      packageVersion: '0.1.1',
    });

    // Never guess production: an unlabelled deployment must stay visible as
    // unknown in dashboards (register() warns about it).
    assert.equal(attributes['deployment.environment.name'], 'unknown');
    assert.equal(attributes['service.version'], '0.1.1');
  });

  it('treats an empty environment as unknown', () => {
    const attributes = resourceAttributes({
      env: { DEPLOYMENT_ENVIRONMENT: '' },
      hostname: 'norse-app-1',
      now: 1_700_000_000_000,
      uptimeSeconds: 0,
      packageVersion: '0.1.1',
    });

    assert.equal(attributes['deployment.environment.name'], 'unknown');
  });

  it('falls back to a random id when the hostname is empty', () => {
    const attributes = resourceAttributes({
      env: {},
      hostname: '   ',
      now: 1_700_000_000_000,
      uptimeSeconds: 0,
      packageVersion: '0.1.1',
    });

    const instanceId = String(attributes['service.instance.id']);
    assert.match(
      instanceId,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    // Both attributes describe the same process; they must not disagree.
    assert.equal(attributes['host.name'], instanceId);
  });
});
