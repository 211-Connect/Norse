'use client';

import { PropsWithChildren, useEffect, useRef, type CSSProperties } from 'react';
import {
  TourProvider as ReactourProvider,
  useTour,
  type ProviderProps,
} from '@reactour/tour';
import { useTranslation } from 'react-i18next';
import { getScrollbarWidth } from '@/app/(app)/shared/lib/utils';
import { ACCESSIBLE_TOUR_ACCENT } from '../theme/theme-config';

const TOUR_DIALOG_ID = 'home-page-tour-dialog';
const TOUR_TITLE_ID = 'home-page-tour-title';
const TOUR_TRIGGER_SELECTOR = '[data-home-tour-trigger="true"]';
const TOUR_CONTENT_SCROLLABLE_CLASS = 'home-tour-scrollable-content';

const focusableSelector = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const DISABLED_TOUR_TABINDEX_ATTR = 'data-tour-original-tabindex';

let lockedBodyScrollY = 0;

function getTourPopover(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '.home-tour-popover, .reactour__popover',
  );
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

function getFocusableOutsidePopover(popover: HTMLElement): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
    .filter((element) => !popover.contains(element))
    .filter((element) => element.getAttribute('aria-hidden') !== 'true');
}

function disableBackgroundFocus(popover: HTMLElement): void {
  getFocusableOutsidePopover(popover).forEach((element) => {
    if (!element.hasAttribute(DISABLED_TOUR_TABINDEX_ATTR)) {
      const currentTabIndex = element.getAttribute('tabindex');
      element.setAttribute(
        DISABLED_TOUR_TABINDEX_ATTR,
        currentTabIndex === null ? '' : currentTabIndex,
      );
    }

    element.setAttribute('tabindex', '-1');
  });
}

function restoreBackgroundFocus(): void {
  Array.from(
    document.querySelectorAll<HTMLElement>(`[${DISABLED_TOUR_TABINDEX_ATTR}]`),
  ).forEach((element) => {
    const originalTabIndex = element.getAttribute(DISABLED_TOUR_TABINDEX_ATTR);

    if (originalTabIndex) {
      element.setAttribute('tabindex', originalTabIndex);
    } else {
      element.removeAttribute('tabindex');
    }

    element.removeAttribute(DISABLED_TOUR_TABINDEX_ATTR);
  });
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

function getContentContainer(
  popover: HTMLElement,
  controlsDiv: HTMLElement | null,
): HTMLElement | null {
  return Array.from(popover.children).find((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child === controlsDiv) return false;
    if (child.classList.contains('reactour__close-button')) return false;
    if (child.tagName === 'SPAN') return false;
    return true;
  }) as HTMLElement | null;
}

function patchPopoverLayout(
  popover: HTMLElement,
  controlsDiv: HTMLElement | null,
): void {
  popover.style.display = 'flex';
  popover.style.flexDirection = 'column';
  popover.style.gap = '1rem';
  popover.style.overflow = 'visible';
  popover.style.padding = '1rem 1rem 1.25rem';
  popover.style.boxSizing = 'border-box';

  const contentContainer = getContentContainer(popover, controlsDiv);
  if (contentContainer) {
    contentContainer.classList.add(TOUR_CONTENT_SCROLLABLE_CLASS);
    contentContainer.style.flex = '1 1 auto';
    contentContainer.style.minHeight = '0';
    contentContainer.style.overflowY = 'auto';
    contentContainer.style.overscrollBehavior = 'contain';
    contentContainer.style.paddingRight = '0.25rem';
  }

  if (controlsDiv) {
    controlsDiv.style.flexShrink = '0';
    controlsDiv.style.marginTop = '0';
    controlsDiv.style.paddingTop = '0.75rem';
    controlsDiv.style.borderTop = '1px solid rgba(15, 23, 42, 0.12)';
    controlsDiv.style.background = 'inherit';
  }
}

function patchDialogRole(popover: HTMLElement, tourLabel: string): void {
  popover.id = TOUR_DIALOG_ID;
  popover.tabIndex = -1;
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-modal', 'true');
  popover.setAttribute('aria-labelledby', TOUR_TITLE_ID);

  let title = popover.querySelector<HTMLElement>(`#${TOUR_TITLE_ID}`);
  if (!title) {
    title = document.createElement('h2');
    title.id = TOUR_TITLE_ID;
    title.className = 'sr-only';
    popover.prepend(title);
  }
  if (title.textContent !== tourLabel) {
    title.textContent = tourLabel;
  }
}

function patchCloseButton(popover: HTMLElement): void {
  const closeButton = popover.querySelector<HTMLElement>(
    '.reactour__close-button',
  );
  if (!closeButton) return;

  closeButton.setAttribute('type', 'button');
  closeButton.style.width = '44px';
  closeButton.style.height = '44px';
  closeButton.style.top = '8px';
  closeButton.style.right = '8px';
  closeButton.style.display = 'flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';

  // Without an explicit size the SVG (display:block) stretches to fill the
  // 44×44 button, producing an oversized icon. Pin it to a readable size.
  const svg = closeButton.querySelector<SVGElement>('svg');
  if (svg) {
    svg.style.width = '16px';
    svg.style.height = '16px';
    svg.style.flexShrink = '0';
  }
}

function patchPaginationDots(
  controlsDiv: HTMLElement,
  currentStep: number,
): void {
  getPaginationButtons(controlsDiv).forEach((button, index) => {
    const isActive = index === currentStep;
    button.setAttribute('type', 'button');
    button.setAttribute('aria-current', isActive ? 'step' : 'false');
    button.style.width = '14px';
    button.style.height = '14px';
    button.style.margin = '0';
    button.style.borderRadius = '9999px';
    button.style.borderStyle = 'solid';
    button.style.borderWidth = '2px';
    button.style.borderColor = isActive
      ? `var(--reactour-accent, ${ACCESSIBLE_TOUR_ACCENT})`
      : '#5e5e5e';
    button.style.color = isActive
      ? `var(--reactour-accent, ${ACCESSIBLE_TOUR_ACCENT})`
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

  const entries: Array<{
    button: HTMLButtonElement | null;
    disabled: boolean;
  }> = [
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
  patchCloseButton(popover);

  const controlsDiv = getControlsDiv(popover);
  patchPopoverLayout(popover, controlsDiv);

  if (controlsDiv) {
    patchPaginationDots(controlsDiv, currentStep);
    patchNavButtons(controlsDiv, currentStep, stepCount);
  }
}

function lockBodyScroll(): void {
  lockedBodyScrollY = window.scrollY;
  const scrollbarWidth = getScrollbarWidth();

  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedBodyScrollY}px`;
  document.body.style.width = '100%';
  document.body.style.left = '0';
  document.body.style.right = '0';

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockBodyScroll(): void {
  const parsedTop = Number.parseInt(document.body.style.top || '0', 10);
  const scrollY = Number.isNaN(parsedTop) ? lockedBodyScrollY : -parsedTop;

  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.paddingRight = '';

  window.scrollTo(0, scrollY);
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
    const tourLabel = t('tour.dialog_title');

    // Re-entrancy guard: DOM mutations from patchTourPopover would otherwise
    // re-trigger the MutationObserver in a loop.
    let isPatching = false;
    const safePatch = () => {
      if (isPatching) return;
      isPatching = true;
      try {
        patchTourPopover(currentStep ?? 0, stepCount, tourLabel);
        const popover = getTourPopover();
        if (popover) {
          disableBackgroundFocus(popover);
        }
      } finally {
        isPatching = false;
      }
    };

    safePatch();
    const viewport = window.visualViewport;

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
      const popover = getTourPopover();
      if (!popover) return;

      const focusableElements = getFocusableElements(popover);
      const activeElement = document.activeElement as HTMLElement | null;
      const isInsidePopover = activeElement
        ? popover.contains(activeElement)
        : false;

      if (!isInsidePopover && ['Tab', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        (focusableElements[0] ?? popover).focus();
        return;
      }

      if (event.key !== 'Tab') return;

      if (focusableElements.length === 0) {
        event.preventDefault();
        popover.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

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

    const handleFocusIn = (event: FocusEvent) => {
      const popover = getTourPopover();
      if (!popover) return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (popover.contains(target)) return;

      event.preventDefault();
      focusTourDialog();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);
    window.addEventListener('resize', safePatch);
    viewport?.addEventListener('resize', safePatch);
    wasOpenRef.current = true;

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      window.removeEventListener('resize', safePatch);
      viewport?.removeEventListener('resize', safePatch);
      restoreBackgroundFocus();
    };
  }, [currentStep, isOpen, steps, t]);

  return null;
}

// @reactour/tour ships React 18 types; casting here keeps ProviderProps checked
// while resolving the JSX element-type mismatch under React 19.
const TypedProvider = ReactourProvider as React.ComponentType<ProviderProps>;

export const TourProvider = ({ children }: PropsWithChildren) => {
  return (
    <TypedProvider
      steps={[]}
      className="home-tour-popover"
      scrollSmooth
      afterOpen={lockBodyScroll}
      beforeClose={unlockBodyScroll}
      inViewThreshold={{ x: 16, y: 24 }}
      disableInteraction={({ currentStep }) => currentStep === 0}
      styles={{
        badge: (baseStyles) => ({
          ...baseStyles,
          top: '-0.625rem',
          left: '-0.625rem',
          backgroundColor: ACCESSIBLE_TOUR_ACCENT,
          color: '#ffffff',
        }),
        popover: (baseStyles) => ({
          ...baseStyles,
          '--reactour-accent': ACCESSIBLE_TOUR_ACCENT,
          width: 'min(36rem, calc(100vw - 2rem))',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100dvh - 2rem)',
          padding: '1rem 1rem 1.25rem',
        }) as CSSProperties,
        }) as CSSProperties,
      }}
    >
      <TourAccessibilityEnhancer />
      {children}
    </TypedProvider>
  );
};
