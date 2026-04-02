'use client';

import { SearchCardComponentProps } from './types';
import { CustomAttributeComponent as ResourceCustomAttributeComponent } from '../../../resource/components/resource-components/custom-attribute';

export function CustomAttributeComponent({
  result,
  customAttribute,
}: SearchCardComponentProps) {
  return (
    <ResourceCustomAttributeComponent
      resource={result}
      customAttribute={customAttribute}
    />
  );
}
