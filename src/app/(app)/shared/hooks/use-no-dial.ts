'use client';

import { NO_DIAL } from '@/app/(app)/features/search/components/no-dial-flag';

import { useFlag } from './use-flag';

/**
 * True when no phone number may dial or text: the no-dial switch is on AND the tenant is on v2
 * (`enableV2Api`). v1 tenants always dial, as before.
 */
export const useNoDial = (): boolean => {
  const v2 = useFlag('enableV2Api');
  return NO_DIAL && v2 === true;
};
