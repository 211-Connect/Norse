import Link from 'next/link';
import { LinkProps } from 'next/link';
import { createReferralEvent } from '../lib/google-tag-manager';
import { cn } from '../lib/utils';
import { buttonVariants } from './ui/button';
import { VariantProps } from 'class-variance-authority';
import { ReactNode } from 'react';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resource: any;
  onClick?: any;
  className?: string;
  children?: ReactNode;
};

export function ReferralLink({
  referralType,
  resourceId,
  onClick,
  resource,
  variant = 'link',
  size,
  className,
  ...rest
}: Props &
  LinkProps &
  VariantProps<typeof buttonVariants> & { target?: string; rel?: string }) {
  const handleLink = (e: any) => {
    createReferralEvent(referralType, resourceId, resource);
    onClick?.(e);
  };

  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={handleLink}
      {...rest}
    />
  );
}
