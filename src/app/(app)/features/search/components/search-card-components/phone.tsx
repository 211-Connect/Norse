'use client';

import { Phone } from 'lucide-react';

import { UmamiEvent, trackUmamiEvent } from '../../../../shared/lib/umami';
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
      onClick={() =>
        trackUmamiEvent(UmamiEvent.PhoneClick, {
          resourceId: String(result.id),
        })
      }
    />
  );
}
