import { createReferralEvent } from '../../lib/hooks/useEventStore/events';
import Link from 'next/link';
import { LinkProps } from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resource: any;
  onClick?: any;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function ReferralButton({
  referralType,
  resourceId,
  onClick,
  resource,
  className,
  disabled = false,
  ...rest
}: Props & LinkProps & { target?: string; rel?: string }) {
  const handleLink = (e: any) => {
    createReferralEvent(referralType, resourceId, resource);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      {...rest}
      className={cn(
        buttonVariants({ variant: 'default' }),
        'gap-2',
        disabled ? 'bg-muted text-gray-500 pointer-events-none' : null,
        className
      )}
      onClick={handleLink}
    />
  );
}
