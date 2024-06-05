import { createLinkEvent } from '@/hooks/use-event-store/events';
import Link, { LinkProps } from 'next/link';

export function NavLink(
  props: { children: React.ReactNode } & LinkProps & {
      target?: string;
      rel?: string;
    },
) {
  const handleLink = (e: any) => {
    createLinkEvent(e);
  };

  return (
    <Link
      {...props}
      className="flex items-center gap-1 p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800"
      onClick={handleLink}
    />
  );
}
