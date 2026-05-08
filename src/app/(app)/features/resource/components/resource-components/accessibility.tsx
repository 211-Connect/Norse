'use client';

import { Accessibility } from 'lucide-react';

import { ResourceComponentProps } from '../component-registry';
import { Datum } from '../datum';

export function AccessibilityComponent({ resource }: ResourceComponentProps) {
  if (!resource.accessibility) {
    return null;
  }

  return (
    <Datum
      icon={Accessibility}
      iconColor="text-custom-blue"
      description={resource.accessibility}
    />
  );
}
