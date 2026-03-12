'use client';

import { BusFront } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

export function TransportationComponent({ resource }: ResourceComponentProps) {
  if (!resource.transportation) {
    return null;
  }

  return (
    <Datum
      icon={BusFront}
      iconColor="text-positive"
      description={resource.transportation}
    />
  );
}
