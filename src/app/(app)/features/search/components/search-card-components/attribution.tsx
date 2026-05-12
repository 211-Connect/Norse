'use client';

import { AttributionComponent as ResourceAttributionComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function AttributionComponent({ result }: SearchCardComponentProps) {
  return <ResourceAttributionComponent resource={result} />;
}
