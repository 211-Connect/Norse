import { createLinkEvent } from '../../lib/hooks/useEventStore/events';
import { NavLinkProps, NavLink as MantineNavLink } from '@mantine/core';
import Link, { LinkProps } from 'next/link';

export function NavLink(
  props: NavLinkProps & LinkProps & { target?: string; rel?: string }
) {
  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  return <MantineNavLink {...props} onClick={handleLink} component={Link} />;
}
