import { createReferralEvent } from '../../lib/hooks/useEventStore/events';
import { ButtonProps, Button } from '@mantine/core';
import Link from 'next/link';
import { LinkProps } from 'next/link';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resource: any;
};

export function ReferralButton({
  referralType,
  resourceId,
  resource,
  ...rest
}: Props & ButtonProps & LinkProps & { target?: string; rel?: string }) {
  const handleLink = () => {
    createReferralEvent(referralType, resourceId, resource);
  };

  return <Button {...rest} component={Link} onClick={handleLink} />;
}
