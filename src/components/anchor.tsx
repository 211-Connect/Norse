import { cn } from '@/lib/utils';
import { createLinkEvent } from '../lib/hooks/use-event-store/events';
import Link, { LinkProps } from 'next/link';

export function Anchor({
  children,
  className,
  ...rest
}: { children?: React.ReactNode; className?: string } & LinkProps & {
    target?: string;
    rel?: string;
    href?: string | null;
  }) {
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
    <Link {...rest} className={cn(className)} onClick={onClick}>
      {children}
    </Link>
  );
}
