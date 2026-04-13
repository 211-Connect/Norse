'use client';

import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  TourProvider as ReactourProvider,
  useTour,
  type ProviderProps,
} from '@reactour/tour';
import { useTranslation } from 'react-i18next';

const TOUR_DIALOG_ID = 'home-page-tour-dialog';
const TOUR_TITLE_ID = 'home-page-tour-title';
const TOUR_TRIGGER_SELECTOR = '[data-home-tour-trigger="true"]';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getTourPopover(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.reactour__popover');
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((el) => el.getAttribute('aria-hidden') !== 'true');
}

function focusTourDialog(): void {
  const popover = getTourPopover();
  if (!popover) return;

  const focusableElements = getFocusableElements(popover);
  const target = focusableElements[0] ?? popover;
  target.focus();
}

function returnFocusToTrigger(): void {
  const trigger = document.querySelector<HTMLElement>(TOUR_TRIGGER_SELECTOR);
  trigger?.focus();
}

// Selects by DOM structure to avoid coupling to @reactour/tour's English aria-labels (e.g. "Go to prev step").
function getControlsDiv(popover: HTMLElement): HTMLElement | null {
  const directDivs = Array.from(
    popover.querySelectorAll<HTMLElement>(':scope > div'),
  );
  return directDivs.at(-1) ?? null;
}

function getPrevButton(controlsDiv: HTMLElement): HTMLButtonElement | null {
  return controlsDiv.querySelector<HTMLButtonElement>(
    ':scope > button:first-of-type',
  );
}

function getNextButton(controlsDiv: HTMLElement): HTMLButtonElement | null {
  return controlsDiv.querySelector<HTMLButtonElement>(
    ':scope > button:last-of-type',
  );
}

function getPaginationButtons(controlsDiv: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    controlsDiv.querySelectorAll<HTMLButtonElement>(':scope > div > button'),
  );
}

function patchDialogRole(popover: HTMLElement, tourLabel: string): void {
  popover.id = TOUR_DIALOG_ID;
  popover.tabIndex = -1;
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-modal', 'true');
  popover.setAttribute('aria-labelledby', TOUR_TITLE_ID);
  popover.classList.add('home-tour-popover');

  let title = popover.querySelector<HTMLElement>(`#${TOUR_TITLE_ID}`);
  if (!title) {
    title = document.createElement('h2');
    title.id = TOUR_TITLE_ID;
    title.className = 'sr-only';
    popover.prepend(title);
  }
  title.textContent = tourLabel;
}

function patchDialogSizing(popover: HTMLElement): void {
  popover.style.width = 'min(36rem, calc(100vw - 2rem))';
  popover.style.maxWidth = 'calc(100vw - 2rem)';
  popover.style.maxHeight = 'calc(100dvh - 2rem)';
  popover.style.overflowY = 'auto';
}

function patchCloseButton(popover: HTMLElement): void {
  const closeButton = popover.querySelector<HTMLElement>(
    '.reactour__close-button',
  );
  if (!closeButton) return;

  closeButton.setAttribute('type', 'button');
  closeButton.style.width = '44px';
  closeButton.style.height = '44px';
  closeButton.style.top = '16px';
  closeButton.style.right = '16px';
}

function patchPaginationDots(
  controlsDiv: HTMLElement,
  currentStep: number,
): void {
  getPaginationButtons(controlsDiv).forEach((button, index) => {
    const isActive = index === currentStep;
    button.setAttribute('type', 'button');
    button.setAttribute('aria-current', isActive ? 'step' : 'false');
    button.style.width = '44px';
    button.style.height = '44px';
    button.style.margin = '0';
    button.style.borderRadius = '9999px';
    button.style.borderWidth = '2px';
    button.style.borderColor = isActive
      ? 'var(--reactour-accent, #005ea2)'
      : '#5e5e5e';
    button.style.color = isActive
      ? 'var(--reactour-accent, #005ea2)'
      : '#5e5e5e';
  });
}

function patchNavButtons(
  controlsDiv: HTMLElement,
  currentStep: number,
  stepCount: number,
): void {
  const previousButton = getPrevButton(controlsDiv);
  const nextButton = getNextButton(controlsDiv);

  const entries: Array<{ button: HTMLButtonElement | null; disabled: boolean }> =
    [
      { button: previousButton, disabled: currentStep === 0 },
      { button: nextButton, disabled: currentStep === stepCount - 1 },
    ];

  entries.forEach(({ button, disabled }) => {
    if (!button) return;
    button.type = 'button';
    button.disabled = disabled;
    button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    button.tabIndex = disabled ? -1 : 0;
    button.style.width = '44px';
    button.style.height = '44px';
    button.style.padding = '12px';
    button.style.borderRadius = '9999px';
  });

  const navigation = previousButton?.parentElement;
  if (navigation instanceof HTMLElement) {
    navigation.classList.add('home-tour-navigation');
  }
}

function patchTourPopover(
  currentStep: number,
  stepCount: number,
  tourLabel: string,
): void {
  const popover = getTourPopover();
  if (!popover) return;

  patchDialogRole(popover, tourLabel);
  patchDialogSizing(popover);
  patchCloseButton(popover);

  const controlsDiv = getControlsDiv(popover);
  if (controlsDiv) {
    patchPaginationDots(controlsDiv, currentStep);
    patchNavButtons(controlsDiv, currentStep, stepCount);
  }
}

function TourAccessibilityEnhancer() {
  const { t } = useTranslation('page-home');
  const { currentStep, isOpen, steps } = useTour();
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        returnFocusToTrigger();
      }
      wasOpenRef.current = false;
      return;
    }

    const stepCount = steps?.length ?? 0;
    const tourLabel = t('tour.dialog_title', { defaultValue: 'Site Walkthrough' });

    // Re-entrancy guard: DOM mutations from patchTourPopover would otherwise
    // re-trigger the MutationObserver in a loop.
    let isPatching = false;
    const safePatch = () => {
      if (isPatching) return;
      isPatching = true;
      try {
        patchTourPopover(currentStep ?? 0, stepCount, tourLabel);
      } finally {
        isPatching = false;
      }
    };

    safePatch();

    const popover = getTourPopover();
    const observer = new MutationObserver(safePatch);

    if (popover) {
      // Observe the popover, not the body — limits scope to avoid firing on
      // unrelated mutations. Attributes excluded so our own style writes
      // don't re-trigger even with the guard above.
      observer.observe(popover, { childList: true, subtree: true });
    } else {
      // Popover not yet mounted (isOpen flipped before React painted) —
      // watch body only for its insertion.
      observer.observe(document.body, { childList: true });
    }

    const focusFrame = window.requestAnimationFrame(() => {
      focusTourDialog();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const popover = getTourPopover();
      if (!popover) return;

      const focusableElements = getFocusableElements(popover);

      if (focusableElements.length === 0) {
        event.preventDefault();
        popover.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isInsidePopover = activeElement
        ? popover.contains(activeElement)
        : false;

      if (!isInsidePopover) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    wasOpenRef.current = true;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [currentStep, isOpen, steps, t]);

  return null;
}

// @reactour/tour ships React 18 types; casting here keeps ProviderProps checked
// while resolving the JSX element-type mismatch under React 19.
const TypedProvider = ReactourProvider as React.ComponentType<ProviderProps>;

export const TourProvider = ({ children }: PropsWithChildren) => {
  return (
    <TypedProvider steps={[]} scrollSmooth>
      <TourAccessibilityEnhancer />
      {children}
    </TypedProvider>
  );
};
