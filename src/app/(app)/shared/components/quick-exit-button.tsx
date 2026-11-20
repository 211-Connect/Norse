'use client';

import { useAtomValue } from 'jotai';
import { LogOut } from 'lucide-react';

import { useAppConfig } from '../hooks/use-app-config';
import { AnalyticsEvent, AnalyticsTools, trackEvent } from '../lib/analytics';
import { NEW_TAB_WARNING } from '../lib/constants';
import { cn } from '../lib/utils';
import { emergencyPopupOpenAtom, searchGuideOpenAtom } from '../store/dialogs';
import { Link } from './link';

/** The one red of Quick exit, in the header and floating (red-700 passes contrast with white). */
export const QUICK_EXIT_CLASSNAME =
  'border-red-700 bg-red-700 text-white hover:bg-red-800 hover:text-white';

/**
 * Prototype: below `xl` the header's Quick exit sits inside the menu, two taps away.
 * This one tap stays on screen, above every dialog. Outside <header>, because a sticky
 * header is its own stacking context. `pointer-events-auto` keeps it working while a
 * modal dialog turns off pointer events on the body.
 */
export function QuickExitButton() {
  const safeExit = useAppConfig().header.safeExit;
  // The full-screen emergency popup carries its own Quick exit inside the dialog (so the focus
  // trap reaches it); this floating one would sit outside the trap, so it steps aside.
  const popupOpen = useAtomValue(emergencyPopupOpenAtom);
  // Phone, search box layer open: the layer fills the screen, so Quick exit sits at its top right, Back at the top left.
  const guideOpen = useAtomValue(searchGuideOpenAtom);

  if (!safeExit?.enabled || popupOpen) return null;

  const newTab = safeExit.target === '_blank';

  return (
    <Link
      target={safeExit.target}
      href={safeExit.url ?? '#'}
      onClick={() => {
        trackEvent(AnalyticsEvent.SafeExitClick, AnalyticsTools.Umami);
      }}
      aria-label={newTab ? `${safeExit.text}${NEW_TAB_WARNING}` : safeExit.text}
      className={cn(
        'pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[60] flex min-h-11 items-center gap-1 rounded-lg px-4 text-sm font-semibold shadow-lg print:hidden',
        QUICK_EXIT_CLASSNAME,
        'xl:hidden',
        guideOpen &&
          'max-sm:top-2 max-sm:right-2 max-sm:bottom-auto max-sm:left-auto max-sm:min-w-11 max-sm:justify-center',
      )}
      data-testid="quick-exit-floating"
    >
      {safeExit.text}
      <LogOut className="size-4" aria-hidden="true" />
    </Link>
  );
}
