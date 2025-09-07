'use client';

import Link, { LinkProps as NextLinkProps } from 'next/link';
import { Ref, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18nConfig from '@/i18nConfig';

export interface LinkProps extends NextLinkProps {
  children?: React.ReactNode;
  className?: string;
  target?: string;
  ref?: Ref<HTMLAnchorElement>;
}

export const LocalizedLink = (props: LinkProps) => {
  const { i18n } = useTranslation();

  const currentLanguage = useMemo(() => i18n.language, [i18n.language]);

  let href = props.href?.toString() || '';

  if (currentLanguage !== i18nConfig.defaultLocale && href.startsWith('/')) {
    href = `/${currentLanguage}${href}`;
  }

  return <Link {...props} href={href} />;
};
