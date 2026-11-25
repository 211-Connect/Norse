import { ReactNode } from 'react';

import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';

import { DialButton } from './dial-button';

/**
 * The call link of the no-results card. With the tenant's v2 switch off it is the v1 link
 * (`LocalizedLink`, raw number); with it on it is the v2 dial link (normalized `tel:`).
 * No hooks here, so a test can read the returned element.
 */
export function NoResultsCall({
  number,
  v2,
  className,
  children,
}: {
  number: string;
  v2: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (!v2) {
    return (
      <LocalizedLink href={`tel:${number}`} className={className}>
        {children}
      </LocalizedLink>
    );
  }
  return (
    <DialButton number={number} testId="no-results-call" className={className}>
      {children}
    </DialButton>
  );
}
