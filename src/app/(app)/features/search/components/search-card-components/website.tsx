'use client';

import { Link } from 'lucide-react';
import { SearchCardComponentProps } from './types';
import { Datum } from '../../../resource/components/datum';

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
    />
  );
}
