import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { cn } from '@/shared/lib/utils';

interface DropdownMenuContentProps
  extends DropdownMenuPrimitive.DropdownMenuContentProps {
  ref?: React.RefObject<HTMLDivElement>;
}

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Content className={cn('mt-2', className)} {...props}>
      {children}
    </DropdownMenuPrimitive.Content>
  );
}

interface DropdownMenuItemProps
  extends DropdownMenuPrimitive.DropdownMenuItemProps {
  ref?: React.RefObject<HTMLDivElement>;
}
export function DropdownMenuItem({
  children,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item {...props}>
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
