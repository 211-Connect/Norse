import { ReactNode } from 'react';
import { createReferralEvent } from '../lib/google-tag-manager';
import { cn } from '../lib/utils';
import { Button, ButtonProps } from './ui/button';
import { ResultType } from '../store/results';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resourceData: ResultType;
  onClick?: any;
  className?: string;
  children?: ReactNode;
};

export function ReferralButton({
  referralType,
  resourceId,
  onClick,
  resource,
  className,
  resourceData,
  ...rest
}: Props & ButtonProps) {
  const handleClick = (e: any) => {
    createReferralEvent(referralType, resourceId, resource);
    onClick?.(e);
  };

  return <Button className={cn(className)} onClick={handleClick} {...rest} />;
}
