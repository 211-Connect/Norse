'use client';

import { noDialFor } from '@/app/(app)/features/search/components/no-dial-flag';

import { useAppConfig } from './use-app-config';

/**
 * True when no phone number may dial or text: the tenant is on v2 (`enableV2Api`), the no-dial
 * switch is on, and the tenant is not turned on (`v2DialingEnabled`, from the server env
 * `V2_DIAL_TENANT_IDS`; see `no-dial-flag.ts`). v1 tenants always dial, as before.
 */
export const useNoDial = (): boolean => noDialFor(useAppConfig().featureFlags);
