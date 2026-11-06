'use client';

import { LogOut } from 'lucide-react';

import { useAppConfig } from '../hooks/use-app-config';
import { AnalyticsEvent, AnalyticsTools, trackEvent } from '../lib/analytics';
import { NEW_TAB_WARNING } from '../lib/constants';
import { Link } from './link';

/**
 * Prototype: below `xl` the header's Quick exit sits inside the menu, two taps away.
 * This one tap stays on screen, above every dialog. Outside <header>, because a sticky
 * header is its own stacking context. `pointer-events-auto` keeps it working while a
 * modal dialog turns off pointer events on the body.
 */
export function QuickExitButton() {
  const safeExit = useAppConfig().header.safeExit;

  if (!safeExit?.enabled) return null;

  const newTab = safeExit.target === '_blank';

  return (
    <Link
      target={safeExit.target}
      href={safeExit.url ?? '#'}
      onClick={() => {
        trackEvent(AnalyticsEvent.SafeExitClick, AnalyticsTools.Umami);
      }}
      aria-label={newTab ? `${safeExit.text}${NEW_TAB_WARNING}` : safeExit.text}
      className="pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[60] flex min-h-11 items-center gap-1 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white shadow-lg xl:hidden print:hidden"
      data-testid="quick-exit-floating"
    >
      {safeExit.text}
      <LogOut className="size-4" aria-hidden="true" />
    </Link>
  );
}
