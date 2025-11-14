'use client';

import NextImage from 'next/image';
import { useAppConfig } from '../hooks/use-app-config';

export function Image(props: React.ComponentProps<typeof NextImage>) {
  const appConfig = useAppConfig();

  let src = props.src;
  if (src && typeof src === 'string' && src.startsWith('/')) {
    src = `${appConfig.baseUrl}${props.src}`;
  }

  return <NextImage {...props} src={src} />;
}
