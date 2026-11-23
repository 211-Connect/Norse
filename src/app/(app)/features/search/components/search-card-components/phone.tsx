'use client';

import { Phone } from 'lucide-react';

import {
  formatPhoneNumber,
  getPhoneHref,
} from '@/app/(app)/shared/utils/phone';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '../../../../shared/lib/analytics';
import { Datum } from '../../../resource/components/datum';
import { useNoDial } from '../../../../shared/hooks/use-no-dial';
import { useIsV2 } from '../v2-results-bridge';
import { SearchCardComponentProps } from './types';

export function PhoneComponent({ result }: SearchCardComponentProps) {
  // Text only while v2 results show AND the tenant is not turned on (`no-dial-flag.ts`).
  const noDial = useIsV2() && useNoDial();

  if (!result.phone) {
    return null;
  }

  return (
    <Datum
      key={result.phone}
      icon={Phone}
      iconColor="text-primary"
      description={formatPhoneNumber(result.phone)}
      url={getPhoneHref(result.phone, { noDial })}
      urlTarget="_self"
      shouldParseHtml={false}
      withPadding={false}
      onClick={() => {
        const resourceId = String(result.id);
        trackEvent(AnalyticsEvent.PhoneClick, AnalyticsTools.UmamiAndMatomo, {
          resourceId,
        });
      }}
    />
  );
}
