'use client';

import { Link } from 'lucide-react';
import { SearchCardComponentProps } from './types';
import { Datum } from '../../../resource/components/datum';
import { trackUmamiEvent, UmamiEvent } from '../../../../shared/lib/umami';

export function WebsiteComponent({ result }: SearchCardComponentProps) {
  if (!result.website) {
    return null;
  }

  return (
    <Datum
      key={result.website}
      icon={Link}
      iconColor="text-primary"
      description={result.website}
      url={result.website}
      urlTarget="_blank"
      shouldParseHtml={false}
      className="py-0"
      onClick={() =>
        trackUmamiEvent(UmamiEvent.WebsiteClick, {
          resourceId: result.id,
        })
      }
    />
  );
}
