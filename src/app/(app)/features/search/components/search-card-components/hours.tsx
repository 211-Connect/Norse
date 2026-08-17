'use client';

import { HoursComponent as ResourceHoursComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function HoursComponent({ result }: SearchCardComponentProps) {
  return (
    <ResourceHoursComponent
      resource={result}
      withPadding={false}
      iconColor="text-primary"
      withTitle={false}
    />
  );
}
