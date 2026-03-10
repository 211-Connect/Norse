'use client';

import { Resource } from '@/types/resource';
import { Datum } from '../datum';
import { LayoutColumnItem } from '../../types/layout-config';

interface CustomAttributeComponentProps {
  resource: Resource;
  customAttribute?: LayoutColumnItem['customAttribute'];
}

export function CustomAttributeComponent({
  resource,
  customAttribute,
}: CustomAttributeComponentProps) {
  if (!customAttribute) {
    return null;
  }

  return (
    <Datum
      title={customAttribute.title}
      subtitle={customAttribute.subtitle}
      description={customAttribute.description}
      url={customAttribute.url}
      urlTarget={customAttribute.urlTarget}
      titleBelow={customAttribute.titleBelow}
      size={customAttribute.size}
    />
  );
}
