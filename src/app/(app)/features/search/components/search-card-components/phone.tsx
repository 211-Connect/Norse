'use client';

import { Phone } from 'lucide-react';

import {
  AnalyticsEvent,
  AnalyticsTools,
  trackEvent,
} from '../../../../shared/lib/analytics';
import { Datum } from '../../../resource/components/datum';
import { SearchCardComponentProps } from './types';

export function PhoneComponent({ result }: SearchCardComponentProps) {
  if (!result.phone) {
    return null;
  }

  return (
    <Datum
      key={result.phone}
      icon={Phone}
      iconColor="text-primary"
      description={result.phone}
      url={`tel:${result.phone}`}
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
