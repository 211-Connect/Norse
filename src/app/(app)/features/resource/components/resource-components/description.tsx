'use client';

import { Resource } from '@/types/resource';
import { Datum } from '../datum';

export function DescriptionComponent({ resource }: { resource: Resource }) {
  if (!resource.description) {
    return null;
  }

  return <Datum description={resource.description} />;
}
