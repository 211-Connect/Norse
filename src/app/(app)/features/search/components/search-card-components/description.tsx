'use client';

import { SearchCardComponentProps } from './types';
import { Datum } from '../../../resource/components/datum';

export function DescriptionComponent({ result }: SearchCardComponentProps) {
  const description = result?.summary ?? result.description;

  if (!description) {
    return null;
  }

  return <Datum description={description} />;
}
