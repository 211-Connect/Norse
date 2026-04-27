'use client';

/**
 * Backdrop a11y: two strategies for “page behind the dialog is not in the tab
 * order and is hidden from assistive tech.”
 *
 * **useDialogAriaSync** — **Radix `Dialog`** (e.g. `DialogContent` from
 * `ui/dialog`). Radix portal content mounts/unmounts with open state and
 * applies `aria-hidden` to the background; it does **not** set `inert` or fix
 * focusable descendants. Use **inside** the dialog surface (where you have
 * the dialog’s **element `id`**, same as `DialogContent`). **Do not** use for
 * a custom full-screen node that is always in the tree with `display`/opacity
 * only — use `useBodySiblingsSync` instead.
 *
 * **useBodySiblingsSync** — **Custom** dialog that stays mounted as a **direct
 * `child` of `document.body`** and toggles `open` (e.g. `SearchDialog`). There
 * is no Radix-managed `aria-hidden` tree, so this hook sets `aria-hidden` +
 * `inert` on every **other** body child. **Do not** use for standard Radix
 * dialogs (that would double-hide or fight Radix). Pass the **ref** to the
 * dialog root and **`open`**.
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

type BodySiblingSnapshot = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
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
 *
 * **When not to use:** always-mounted custom overlays that are not Radix
 * `Dialog` — use `useBodySiblingsSync` (see module doc at top of file).
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

/**
 * Hides all body-level siblings of a custom (non-Radix) portal dialog from
 * both AT and keyboard focus when the dialog is open, and fully restores them
 * when it closes or the component unmounts.
 *
 * **When to use:** the dialog is always mounted as a `body` child and only
 * `open` toggles (e.g. `SearchDialog`).
 *
 * **When not to use:** standard `Dialog` from `ui/dialog` that uses Radix —
 * use `useDialogAriaSync` on `DialogContent` instead; Radix already manages
 * `aria-hidden` on the page and this hook would fight or duplicate that.
 */
export function useBodySiblingsSync(
  dialogRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const hiddenSiblingsRef = useRef<BodySiblingSnapshot[]>([]);

  const restoreSiblings = useCallback(() => {
    hiddenSiblingsRef.current.forEach((snapshot) => {
      restoreBodySiblingSnapshot(snapshot);
    });
    hiddenSiblingsRef.current = [];
  }, []);

  useLayoutEffect(() => {
    const dialogElement = dialogRef.current;

    if (!open || !dialogElement) {
      restoreSiblings();
      return;
    }

    const siblingsToHide = Array.from(document.body.children).filter(
      (el): el is HTMLElement => el !== dialogElement,
    );

    hiddenSiblingsRef.current = siblingsToHide.map((element) =>
      readBodySiblingSnapshot(element),
    );

    siblingsToHide.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.inert = true;
    });

    return restoreSiblings;
  }, [open, dialogRef, restoreSiblings]);
}
