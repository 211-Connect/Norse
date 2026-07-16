'use client';

import { LinkProps as NextLinkProps } from 'next/link';
import { forwardRef } from 'react';

import { LocalizedLink } from './LocalizedLink';

export interface LinkProps extends NextLinkProps {
  children?: React.ReactNode;
  className?: string;
  target?: string;
  tabIndex?: number;
}
const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ children, ...props }, ref) => {
    const onClick = (e: any) => {
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
