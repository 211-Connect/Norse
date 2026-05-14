'use client';

import { BusFront } from 'lucide-react';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

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
