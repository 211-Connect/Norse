'use client';

import NextImage from 'next/image';
import { useAppConfig } from '../hooks/use-app-config';

export function Image(props: React.ComponentProps<typeof NextImage>) {
  const appConfig = useAppConfig();
  const src = props.src && `${appConfig.baseUrl}${props.src}`;

  return <NextImage {...props} src={src} />;
}
