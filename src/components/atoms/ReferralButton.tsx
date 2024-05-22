import { createReferralEvent } from '../../lib/hooks/useEventStore/events';
import Link from 'next/link';
import { LinkProps } from 'next/link';
import { Button, buttonVariants, ButtonProps } from '@/components/ui/button';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resource: any;
  onClick?: any;
};

export function ReferralButton({
  referralType,
  resourceId,
  onClick,
  resource,
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
      className={buttonVariants({ variant: 'default' })}
      onClick={handleLink}
    />
  );
}
