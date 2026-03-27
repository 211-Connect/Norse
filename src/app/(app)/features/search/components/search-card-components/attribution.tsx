'use client';

import { SearchCardComponentProps } from './types';
import { AttributionComponent as ResourceAttributionComponent } from '../../../resource/components/resource-components';

export function AttributionComponent({ result }: SearchCardComponentProps) {
  return <ResourceAttributionComponent resource={result} />;
}
