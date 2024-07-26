import { createReferralEvent } from '../../../packages/client/lib/hooks/useEventStore/events';
import { ButtonProps, Button } from '@mantine/core';
import Link from 'next/link';
import { LinkProps } from 'next/link';

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
}: Props & ButtonProps & LinkProps & { target?: string; rel?: string }) {
  const handleLink = (e: any) => {
    createReferralEvent(referralType, resourceId, resource);
    if (onClick) {
      onClick(e);
    }
  };

  return <Button {...rest} component={Link} onClick={handleLink} />;
}
