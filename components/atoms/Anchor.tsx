import { createLinkEvent } from '../../lib/hooks/useEventStore/events';
import { AnchorProps, Anchor as MantineAnchor } from '@mantine/core';
import Link, { LinkProps } from 'next/link';

export function Anchor({
  children,
  ...rest
}: AnchorProps &
  LinkProps & { target?: string; rel?: string; href?: string | null }) {
  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  const onClick = (e: any) => {
    handleLink(e);

    if (rest.onClick) {
      rest.onClick(e);
    }
  };

  return (
    <MantineAnchor {...rest} onClick={onClick} component={Link}>
      {children}
    </MantineAnchor>
  );
}
