'use client';

import { ApplicationProcessComponent as ResourceApplicationProcessComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function ApplicationProcessComponent({
  result,
}: SearchCardComponentProps) {
  return (
    <ResourceApplicationProcessComponent
      resource={result}
      withPadding={false}
    />
  );
}
