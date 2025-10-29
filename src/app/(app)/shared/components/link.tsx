'use client';

import * as React from 'react';
import { LinkProps as NextLinkProps } from 'next/link';
import { createLinkEvent } from '@/app/(app)/shared/lib/google-tag-manager';
import { LocalizedLink } from './LocalizedLink';

export interface LinkProps extends NextLinkProps {
  children?: React.ReactNode;
  className?: string;
  target?: string;
}
const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, ...props }, ref) => {
    const handleLink = (e: any) => {
      createLinkEvent(e);
    };

    const onClick = (e: any) => {
      handleLink(e);

      if (props.onClick) {
        props.onClick(e);
      }
    };

    return (
      <LocalizedLink {...props} onClick={onClick} ref={ref}>
        {children}
      </LocalizedLink>
    );
  },
);
Link.displayName = 'Link';

export { Link };
