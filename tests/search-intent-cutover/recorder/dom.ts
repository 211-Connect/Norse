// Cut-over scaffolding (ISS-2371): deleted by ISS-2377.
//
// A real DOM for the few builders whose URL logic runs in effects or after user interaction. happy-dom is
// already installed (a dependency of @payloadcms/richtext-lexical), so nothing is added. The DOM globals
// exist only inside withDom(): server-side harnesses must keep seeing `typeof window === 'undefined'`.
import { Window } from 'happy-dom';
import { act, createElement, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';

const GLOBALS = [
  'window',
  'document',
  'navigator',
  'location',
  'HTMLElement',
  'HTMLButtonElement',
  'HTMLInputElement',
  'Element',
  'Node',
  'Text',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
  'FocusEvent',
  'CustomEvent',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'sessionStorage',
  'localStorage',
  'DocumentFragment',
  'ShadowRoot',
  'SVGElement',
  'customElements',
  'IntersectionObserver',
  'ResizeObserver',
  'matchMedia',
  'DOMRect',
  'self',
  'requestIdleCallback',
  'cancelIdleCallback',
] as const;

export type Mounted = HTMLElement & {
  rerender(el: ReactElement): Promise<void>;
};

type Session = { win: Window; restore: () => Promise<void> };
let session: Session | null = null;

function open(url: string): Session {
  const win = new Window({ url });
  const g = globalThis as Record<string, unknown>;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  for (const k of GLOBALS) {
    saved.set(k, Object.getOwnPropertyDescriptor(g, k));
    Object.defineProperty(g, k, {
      configurable: true,
      writable: true,
      value: (win as unknown as Record<string, unknown>)[k],
    });
  }
  g.IS_REACT_ACT_ENVIRONMENT = true;
  // next/link schedules prefetch work with requestIdleCallback, which happy-dom doesn't provide.
  if (!(win as unknown as Record<string, unknown>).requestIdleCallback) {
    g.requestIdleCallback = (cb: () => void) => setTimeout(cb, 0);
    g.cancelIdleCallback = (id: number) => clearTimeout(id);
  }
  g.self = g.window;
  return {
    win,
    restore: async () => {
      for (const k of GLOBALS) {
        const d = saved.get(k);
        if (d) Object.defineProperty(g, k, d);
        else delete g[k];
      }
      delete g.IS_REACT_ACT_ENVIRONMENT;
      await win.happyDOM.close();
    },
  };
}

/**
 * Run one case in a DOM. One window is shared by every case of a harness (opening a window per case cost
 * ~70 ms); each case gets its own URL, container and React root, unmounted afterwards. Call closeDom()
 * when the harness is done, so server-side harnesses see no `window` again.
 */
export async function withDom<T>(
  url: string,
  run: (mount: (el: ReactElement) => Promise<Mounted>) => Promise<T>,
): Promise<T> {
  session ??= open(url);
  const { win } = session;
  win.happyDOM.setURL(url);
  const roots: Array<ReturnType<typeof createRoot>> = [];
  const hosts: HTMLElement[] = [];
  try {
    return await run(async (el) => {
      const host = win.document.createElement('div') as unknown as HTMLElement;
      win.document.body.appendChild(host as never);
      hosts.push(host);
      const root = createRoot(host);
      roots.push(root);
      await act(async () => root.render(el));
      await settle();
      const mounted = host as Mounted;
      mounted.rerender = async (next) => {
        await act(async () => root.render(next));
        await settle();
      };
      return mounted;
    });
  } finally {
    for (const r of roots) await act(async () => r.unmount());
    for (const h of hosts) h.remove();
  }
}

export async function closeDom() {
  if (!session) return;
  const s = session;
  session = null;
  await s.restore();
}

/** Let effects and the promises they start resolve. */
export async function settle(rounds = 2) {
  for (let i = 0; i < rounds; i++)
    await act(async () => new Promise((r) => setTimeout(r, 0)));
}

export { act, createElement };
