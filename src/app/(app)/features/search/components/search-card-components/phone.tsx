'use client';

import { Phone } from 'lucide-react';
import { SearchCardComponentProps } from './types';
import { Datum } from '../../../resource/components/datum';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';

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
      className="py-0"
      onClick={() =>
        trackUmamiEvent(UmamiEvent.PhoneClick, {
          resourceId: String(result.id),
        })
      }
    />
  );
}
