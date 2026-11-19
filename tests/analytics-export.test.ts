import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';

const globals = globalThis as typeof globalThis & {
  testExportButton?: (props: {
    children: React.ReactNode;
    el?: string;
    url?: string;
    onClick?: () => void;
  }) => React.ReactNode;
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@payloadcms/ui') {
      return {
        url: 'data:text/javascript,export const Button = (props) => globalThis.testExportButton(props)',
        shortCircuit: true,
      };
    }
    if (specifier === '@payloadcms/plugin-multi-tenant/client') {
      return {
        url: 'data:text/javascript,export const useTenantSelection = () => ({ selectedTenantID: "tenant-1" })',
        shortCircuit: true,
      };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (/\.(css|scss)$/.test(url)) {
      return { format: 'module', source: '', shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

test('export renders consistently and downloads the current 24-hour range', async () => {
  // Load after installing module hooks for the Payload UI and tenant context.
  const { default: ExportCSVButton } =
    await import('../src/payload/components/analytics/ExportCSVButton');
  const originalDate = globalThis.Date;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let clock = Date.parse('2026-11-18T15:00:00Z');
  let onClick: (() => void) | undefined;
  let destination = '';

  globals.testExportButton = (props) => {
    onClick = props.onClick;
    return React.createElement(
      props.el === 'anchor' ? 'a' : 'button',
      props.el === 'anchor' ? { href: props.url } : null,
      props.children,
    );
  };
  globalThis.Date = new Proxy(originalDate, {
    construct(target, args) {
      return Reflect.construct(target, args.length ? args : [clock]);
    },
    get(target, property, receiver) {
      return property === 'now'
        ? () => clock
        : Reflect.get(target, property, receiver);
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location: {
        assign: (url: string) => {
          destination = url;
        },
      },
    },
  });

  try {
    const serverMarkup = renderToString(React.createElement(ExportCSVButton));
    clock += 1000;
    const clientMarkup = renderToString(React.createElement(ExportCSVButton));
    assert.equal(clientMarkup, serverMarkup);
    assert.ok(onClick);
    onClick();

    const url = new URL(destination, 'http://localhost');
    assert.equal(url.searchParams.get('tenantId'), 'tenant-1');
    assert.equal(Number(url.searchParams.get('endAt')), clock);
    assert.equal(
      Number(url.searchParams.get('startAt')),
      clock - 24 * 60 * 60 * 1000,
    );
  } finally {
    globalThis.Date = originalDate;
    delete globals.testExportButton;
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  }
});
