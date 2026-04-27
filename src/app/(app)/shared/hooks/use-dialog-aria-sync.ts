'use client';

/**
 * Background / backdrop accessibility: keep content **behind** modals out of the
 * keyboard tab order and AT exposure.
 *
 * **Convention:** do **not** pass **`inert` as a JSX/React prop.** `@types/react`
 * does not reliably include it; all `inert` / `[inert]` is applied **inside this
 * module only** (`element.inert`, `setAttribute`), via **`useDialogAriaSync`** or
 * **`useBodySiblingsSync`** as appropriate — never duplicated on components.
 *
 * **useDialogAriaSync(dialogId)** — **Radix `Dialog`** (`DialogContent` in
 * `ui/dialog`). Radix sets `aria-hidden` on hidden layers but not `inert`; this
 * hook syncs `inert` + `tabindex` with that tree.
 *
 * **useBodySiblingsSync(dialogRef, open)** — **Custom** dialog portaled as a
 * **direct child of `document.body`** (e.g. `SearchDialog` when `#app-root` is
 * `<body>`). `inert`/`aria-modal` on the overlay alone only affect that subtree —
 * scanners and AT still see **sibling** page chrome unless we mark **other**
 * `body.children` as `aria-hidden` + `inert` while open (and restore on close).
 *
 * @module use-dialog-aria-sync
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';

const HIDDEN_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  'iframe',
  '[contenteditable="true"]',
  '[tabindex]',
].join(', ');

/** Full snapshot for Radix sync (includes tabindex / inert attr for restore). */
type RadixElementState = {
  ariaHidden: string | null;
  inert: boolean;
  inertAttribute: string | null;
  tabIndexAttribute: string | null;
};

function readRadixElementState(element: HTMLElement): RadixElementState {
  return {
    ariaHidden: element.getAttribute('aria-hidden'),
    inert: element.inert,
    inertAttribute: element.getAttribute('inert'),
    tabIndexAttribute: element.getAttribute('tabindex'),
  };
}

function restoreRadixElementState(
  element: HTMLElement,
  state: RadixElementState,
): void {
  if (state.ariaHidden === null) {
    element.removeAttribute('aria-hidden');
  } else {
    element.setAttribute('aria-hidden', state.ariaHidden);
  }

  element.inert = state.inert;

  if (state.inertAttribute === null) {
    element.removeAttribute('inert');
  } else {
    element.setAttribute('inert', state.inertAttribute);
  }

  if (state.tabIndexAttribute === null) {
    element.removeAttribute('tabindex');
  } else {
    element.setAttribute('tabindex', state.tabIndexAttribute);
  }
}

/** How Radix marks hidden layers after `remember` — matches existing behaviour. */
function applyRadixInertOverlay(element: HTMLElement): void {
  element.inert = true;
  element.setAttribute('inert', '');
}

/**
 * Synchronises Radix Dialog's aria-hidden tree with the inert attribute so
 * that background content is removed from both AT and keyboard focus.
 *
 * Radix sets aria-hidden on siblings of the portal but does not add inert,
 * which means keyboard users can still tab into hidden content and AT sees
 * elements that are both focusable and aria-hidden. This hook fixes that by:
 *   1. Adding inert to every aria-hidden container (removes keyboard access).
 *   2. Setting tabindex="-1" on focusable children of hidden containers.
 *   3. Setting tabindex="-1" on Radix focus-guard spans (they are both
 *      aria-hidden and tabindex="0", causing "non-active element in tab order"
 *      violations).
 *
 * Call this hook inside a component that is only mounted while the dialog is
 * open (e.g. DialogContent). It restores all original states on unmount.
 */
export function useDialogAriaSync(dialogId: string) {
  const syncingRef = useRef(false);
  const elementStateRef = useRef(new Map<HTMLElement, RadixElementState>());

  const rememberElementState = useCallback((element: HTMLElement) => {
    if (elementStateRef.current.has(element)) {
      return;
    }
    elementStateRef.current.set(element, readRadixElementState(element));
  }, []);

  const restoreManagedElements = useCallback(() => {
    elementStateRef.current.forEach((state, element) => {
      restoreRadixElementState(element, state);
    });
    elementStateRef.current.clear();
  }, []);

  const syncHiddenTree = useCallback(() => {
    if (syncingRef.current) {
      return;
    }

    const dialogElement = document.getElementById(dialogId);

    if (!dialogElement) {
      return;
    }

    syncingRef.current = true;

    try {
      const overlayElement = dialogElement.previousElementSibling;
      const keepVisible = new Set<Element>([dialogElement]);

      if (overlayElement) {
        keepVisible.add(overlayElement);
      }

      const managedElements = new Set<HTMLElement>();

      const hiddenElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-aria-hidden="true"], [aria-hidden="true"]',
        ),
      ).filter((element) => !keepVisible.has(element));

      hiddenElements.forEach((element) => {
        rememberElementState(element);
        applyRadixInertOverlay(element);
        managedElements.add(element);
      });

      const hiddenFocusableElements = new Set<HTMLElement>();

      hiddenElements.forEach((element) => {
        if (element.matches(HIDDEN_FOCUSABLE_SELECTOR)) {
          hiddenFocusableElements.add(element);
        }

        element
          .querySelectorAll<HTMLElement>(HIDDEN_FOCUSABLE_SELECTOR)
          .forEach((child) => hiddenFocusableElements.add(child));
      });

      // Radix focus guards sit outside the portal with aria-hidden="true" but
      // tabindex="0". Demote them so they never appear in the tab order.
      Array.from(
        document.querySelectorAll<HTMLElement>('[data-radix-focus-guard]'),
      ).forEach((element) => hiddenFocusableElements.add(element));

      hiddenFocusableElements.forEach((element) => {
        rememberElementState(element);

        if (element.getAttribute('tabindex') !== '-1') {
          element.setAttribute('tabindex', '-1');
        }

        managedElements.add(element);
      });

      // Release elements no longer in the managed set (e.g. after DOM changes).
      Array.from(elementStateRef.current.keys()).forEach((element) => {
        if (managedElements.has(element)) {
          return;
        }

        const state = elementStateRef.current.get(element);

        if (!state) {
          return;
        }

        restoreRadixElementState(element, state);
        elementStateRef.current.delete(element);
      });
    } finally {
      syncingRef.current = false;
    }
  }, [dialogId, rememberElementState]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      syncHiddenTree();
    });

    const observer = new MutationObserver(() => {
      syncHiddenTree();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'data-aria-hidden'],
    });

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
      restoreManagedElements();
    };
  }, [restoreManagedElements, syncHiddenTree]);
}

type BodySiblingSnapshot = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
};

type FocusableDescendantSnapshot = {
  element: HTMLElement;
  tabIndex: string | null;
};

function readBodySiblingSnapshot(element: HTMLElement): BodySiblingSnapshot {
  return {
    element,
    ariaHidden: element.getAttribute('aria-hidden'),
    inert: element.inert,
  };
}

function restoreBodySiblingSnapshot(snapshot: BodySiblingSnapshot): void {
  const { element, ariaHidden, inert } = snapshot;
  if (ariaHidden === null) {
    element.removeAttribute('aria-hidden');
  } else {
    element.setAttribute('aria-hidden', ariaHidden);
  }
  element.inert = inert;
}

function readFocusableDescendants(
  container: HTMLElement,
): FocusableDescendantSnapshot[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(HIDDEN_FOCUSABLE_SELECTOR),
  ).map((el) => ({ element: el, tabIndex: el.getAttribute('tabindex') }));
}

function restoreFocusableDescendant(
  snapshot: FocusableDescendantSnapshot,
): void {
  if (snapshot.tabIndex === null) {
    snapshot.element.removeAttribute('tabindex');
  } else {
    snapshot.element.setAttribute('tabindex', snapshot.tabIndex);
  }
}

/**
 * Hides every other direct `body` sibling of a custom portal dialog from AT and
 * keyboard focus when open (see module doc). Sets `inert` on the dialog root when
 * closed for always-mounted overlays.
 */
export function useBodySiblingsSync(
  dialogRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const hiddenSiblingsRef = useRef<BodySiblingSnapshot[]>([]);
  const hiddenFocusablesRef = useRef<FocusableDescendantSnapshot[]>([]);

  const restoreSiblings = useCallback(() => {
    hiddenFocusablesRef.current.forEach(restoreFocusableDescendant);
    hiddenFocusablesRef.current = [];

    hiddenSiblingsRef.current.forEach((snapshot) => {
      restoreBodySiblingSnapshot(snapshot);
    });
    hiddenSiblingsRef.current = [];
  }, []);

  useLayoutEffect(() => {
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      restoreSiblings();
      return;
    }

    dialogElement.inert = !open;

    if (!open) {
      restoreSiblings();
      return;
    }

    const siblingsToHide = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el !== dialogElement,
    );

    hiddenSiblingsRef.current = siblingsToHide.map((element) =>
      readBodySiblingSnapshot(element),
    );

    hiddenFocusablesRef.current = siblingsToHide.flatMap(
      readFocusableDescendants,
    );
    hiddenFocusablesRef.current.forEach(({ element }) => {
      element.setAttribute('tabindex', '-1');
    });

    siblingsToHide.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.inert = true;
    });

    return restoreSiblings;
  }, [open, dialogRef, restoreSiblings]);
}
