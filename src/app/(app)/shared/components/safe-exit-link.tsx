'use client';

import { LogOut } from 'lucide-react';

import { useAppConfig } from '../hooks/use-app-config';
import { AnalyticsEvent, AnalyticsTools, trackEvent } from '../lib/analytics';
import { NEW_TAB_WARNING } from '../lib/constants';
import { Link } from './link';

/**
 * The tenant's Safe Exit link (Payload `header.safeExit`): text, url, target, the click event and the
 * new-tab warning. The header item, the floating button and the emergency popup are this one link with
 * their own `className`. Renders nothing when the tenant has Safe Exit off.
 */
export function SafeExitLink({
  className,
  testId,
}: {
  className?: string;
  testId?: string;
}) {
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
      className={className}
      data-testid={testId}
    >
      {safeExit.text}
      <LogOut className="size-4" aria-hidden="true" />
      {newTab && <span className="sr-only">{NEW_TAB_WARNING}</span>}
    </Link>
  );
}
