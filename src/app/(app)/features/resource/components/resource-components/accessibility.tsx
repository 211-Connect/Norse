'use client';

import { Accessibility } from 'lucide-react';
import { Datum } from '../datum';
import { ResourceComponentProps } from '../component-registry';

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
