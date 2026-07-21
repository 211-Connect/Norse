'use client';

import { EligibilityComponent as ResourceEligibilityComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function EligibilityComponent({ result }: SearchCardComponentProps) {
  return (
    <ResourceEligibilityComponent
      resource={result}
      iconColor="text-destructive"
      withPadding={false}
    />
  );
}
