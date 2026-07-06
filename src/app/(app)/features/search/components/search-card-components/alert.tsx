'use client';

import { AlertComponent as ResourceAlertComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function AlertComponent({ result }: SearchCardComponentProps) {
  return <ResourceAlertComponent resource={result} />;
}
