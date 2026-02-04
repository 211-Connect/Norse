'use client';

import { ReactNode } from 'react';

import { createReferralEvent } from '../lib/google-tag-manager';
import { cn } from '../lib/utils';
import { Button, ButtonProps } from './ui/button';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import { useAppConfig } from '../hooks/use-app-config';
import { SearchResultItem } from '@/types/search';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resourceData: Partial<SearchResultItem>;
  onClick?: any;
  className?: string;
  children?: ReactNode;
};

export function ReferralButton({
  referralType,
  resourceId,
  onClick,
  className,
  resourceData,
  ...rest
}: Props & ButtonProps) {
  const { searchParamsObject } = useClientSearchParams();
  const appConfig = useAppConfig();

  const handleClick = (e: any) => {
    createReferralEvent(
      referralType,
      resourceId,
      resourceData,
      searchParamsObject,
      appConfig.sessionId,
    );
    onClick?.(e);
  };

  return <Button className={cn(className)} onClick={handleClick} {...rest} />;
}
