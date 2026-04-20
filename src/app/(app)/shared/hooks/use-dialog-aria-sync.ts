'use client';

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

type SavedElementState = {
  ariaHidden: string | null;
  inert: boolean;
  inertAttribute: string | null;
  tabIndexAttribute: string | null;
};

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
  const elementStateRef = useRef(new Map<HTMLElement, SavedElementState>());

  const rememberElementState = useCallback((element: HTMLElement) => {
    if (elementStateRef.current.has(element)) {
      return;
    }

    elementStateRef.current.set(element, {
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
      inertAttribute: element.getAttribute('inert'),
      tabIndexAttribute: element.getAttribute('tabindex'),
    });
  }, []);

  const restoreManagedElements = useCallback(() => {
    elementStateRef.current.forEach((state, element) => {
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
        element.inert = true;
        element.setAttribute('inert', '');
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

type HiddenSiblingState = {
  element: HTMLElement;
  ariaHidden: string | null;
  inert: boolean;
};

/**
 * Hides all body-level siblings of a custom (non-Radix) portal dialog from
 * both AT and keyboard focus when the dialog is open, and fully restores them
 * when it closes or the component unmounts.
 *
 * Use this for dialogs that are always mounted and toggle visibility via state
 * rather than portalling in/out of the DOM (e.g. SearchDialog). For Radix
 * dialogs that unmount when closed, use useDialogAriaSync instead.
 */
export function useBodySiblingsSync(
  dialogRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const hiddenSiblingsRef = useRef<HiddenSiblingState[]>([]);

  const restoreSiblings = useCallback(() => {
    hiddenSiblingsRef.current.forEach(({ element, ariaHidden, inert }) => {
      if (ariaHidden === null) {
        element.removeAttribute('aria-hidden');
      } else {
        element.setAttribute('aria-hidden', ariaHidden);
      }

      element.inert = inert;
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

    hiddenSiblingsRef.current = siblingsToHide.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.inert,
    }));

    siblingsToHide.forEach((element) => {
      element.setAttribute('aria-hidden', 'true');
      element.inert = true;
    });

    return restoreSiblings;
  }, [open, dialogRef, restoreSiblings]);
}
