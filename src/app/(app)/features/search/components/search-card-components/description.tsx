'use client';

import { Datum } from '../../../resource/components/datum';
import { SearchCardComponentProps } from './types';

export function DescriptionComponent({ result }: SearchCardComponentProps) {
  const description = result?.summary ?? result.description;

  if (!description) {
    return null;
  }

  return <Datum description={description} />;
}
