import * as React from 'react';
import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import { createLinkEvent } from '@/shared/lib/google-tag-manager';

export interface LinkProps extends NextLinkProps {
  children?: React.ReactNode;
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ ...props }, ref) => {
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
      <NextLink {...props} onClick={onClick} ref={ref}>
        {props.children}
      </NextLink>
    );
  }
);
Link.displayName = 'Link';

export { Link };
