'use client';

import { AddressComponent as ResourceAddressComponent } from '../../../resource/components/resource-components';
import { SearchCardComponentProps } from './types';

export function AddressComponent({ result }: SearchCardComponentProps) {
  return <ResourceAddressComponent resource={result} withIcon />;
}
