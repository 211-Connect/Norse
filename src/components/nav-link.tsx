import { createLinkEvent } from '../lib/hooks/useEventStore/events';
import Link, { LinkProps } from 'next/link';

export function NavLink(
  props: { children: React.ReactNode } & LinkProps & {
      target?: string;
      rel?: string;
    }
) {
  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  return (
    <Link
      {...props}
      className="p-2 flex gap-1 hover:bg-card items-center"
      onClick={handleLink}
    />
  );
}
