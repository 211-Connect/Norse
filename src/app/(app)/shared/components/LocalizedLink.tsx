'use client';

import Link, { LinkProps as NextLinkProps } from 'next/link';
import { Ref, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '../hooks/use-app-config';
import { localizeHref } from '../lib/localized-href';

export interface LinkProps extends NextLinkProps {
  children?: React.ReactNode;
  className?: string;
  target?: string;
  ref?: Ref<HTMLAnchorElement>;
}

export const LocalizedLink = (props: LinkProps) => {
  const appConfig = useAppConfig();
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  const href = localizeHref(
    props.href?.toString() || '',
    currentLanguage,
    appConfig.i18n.defaultLocale,
  );

  return <Link {...props} href={href} rel="noopener noreferrer" />;
};
