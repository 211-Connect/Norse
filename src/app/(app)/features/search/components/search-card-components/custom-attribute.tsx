'use client';

import { CustomAttributeComponent as ResourceCustomAttributeComponent } from '../../../resource/components/resource-components/custom-attribute';
import { SearchCardComponentProps } from './types';

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
