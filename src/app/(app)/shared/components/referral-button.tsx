'use client';

import * as React from 'react';
import { ReactNode } from 'react';

import { createReferralEvent } from '../lib/google-tag-manager';
import { cn } from '../lib/utils';
import { Button, ButtonProps } from './ui/button';
import { ResultType } from '../store/results';
import { useClientSearchParams } from '../hooks/use-client-search-params';
import { useAppConfig } from '../hooks/use-app-config';

type Props = {
  referralType: 'call_referral' | 'website_referral' | 'directions_referral';
  resourceId: string;
  resourceData: Partial<ResultType>;
  onClick?: React.MouseEventHandler;
  className?: string;
  children?: ReactNode;
};

export const ReferralButton = React.forwardRef<
  HTMLButtonElement,
  Props & ButtonProps
>(function ReferralButton(
  { referralType, resourceId, onClick, className, resourceData, ...rest },
  ref,
) {
  const { searchParamsObject } = useClientSearchParams();
  const appConfig = useAppConfig();

  const handleClick: React.MouseEventHandler = (e) => {
    createReferralEvent(
      referralType,
      resourceId,
      resourceData,
      searchParamsObject,
      appConfig.sessionId,
    );
    onClick?.(e);
  };

  return (
    <Button
      ref={ref}
      className={cn(className)}
      onClick={handleClick}
      {...rest}
    />
  );
});
