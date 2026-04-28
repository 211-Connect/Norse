'use client';

/**
 * **`useBodySiblingsSync(dialogRef, open)`** — for **custom** dialogs portaled as a
 * **direct child of `document.body`** (e.g. `SearchDialog`). `inert` / `aria-modal`
 * on the overlay alone only affect that subtree; scanners and keyboard focus still
 * reach **sibling** page chrome unless we mark **other** `body.children` as
 * `aria-hidden` + `inert` while open (and restore on close).
 *
 * **Radix `Dialog`** (`ui/dialog`): background **`inert`** sync was previously done
 * in a MutationObserver-heavy hook; that was removed in favour of **declarative**
 * styling on the shared `Dialog` primitives (e.g. `data-[state=closed]:pointer-events-none`)
 * and Radix’s own focus management. Revisit only if VPAT retesting shows focus
 * escaping behind standard modals.
 *
 * **Convention:** do **not** pass **`inert` as a JSX/React prop.** `@types/react`
 * does not reliably include it; `inert` / `[inert]` for body siblings is applied
 * **inside this module only** — never duplicated on components.
 *
 * @module use-body-siblings-sync
 */
import { useCallback, useLayoutEffect, useRef } from 'react';
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
