'use client';

import { CheckIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { createContext, forwardRef, useContext, useState } from 'react';

import { cn } from '../../lib/utils';
import { fontSans } from '../../styles/fonts';

const SelectContentIdContext = createContext<string | undefined>(undefined);

export const SELECT_INTERACTIVE_ACTIVE_CLASSNAME =
  'bg-primary text-primary-foreground';

type RadixSelectRootProps = React.ComponentPropsWithoutRef<
  typeof SelectPrimitive.Root
>;

/**
 * - **Default:** Radix `Select` with optional `contentId` (for trigger/content id wiring only).
 * - **With `a11yLabel`:** also enables the VPAT pattern: your label, a hidden
 *   `role="listbox"` when closed, and internal `open` / `onOpenChange` (requires
 *   `contentId`). Omit passing `open` / `onOpenChange` in that mode—they are owned here.
 */
export type SelectProps =
  | (RadixSelectRootProps & {
      contentId?: string;
      a11yLabel?: undefined;
    })
  | (Omit<RadixSelectRootProps, 'open' | 'onOpenChange'> & {
      /**
       * e.g. shadcn `Label` with `htmlFor` matching `SelectTrigger`’s `id`. When set,
       * the closed-menu placeholder listbox and internal open state are applied.
       */
      a11yLabel: React.ReactNode;
      contentId: string;
    });

const Select = (props: SelectProps) => {
  if ('a11yLabel' in props && props.a11yLabel != null) {
    const { a11yLabel, contentId, children, ...rest } = props;
    return (
      <SelectA11yBundle a11yLabel={a11yLabel} contentId={contentId} rest={rest}>
        {children}
      </SelectA11yBundle>
    );
  }

  const { contentId, children, ...rest } = props;
  return (
    <SelectContentIdContext.Provider value={contentId}>
      <SelectPrimitive.Root {...rest}>{children}</SelectPrimitive.Root>
    </SelectContentIdContext.Provider>
  );
};

type SelectA11yShellRest = Omit<
  RadixSelectRootProps,
  'open' | 'onOpenChange' | 'children'
>;

/** Internal: open state + closed placeholder, used when `Select` has `a11yLabel` set. */
function SelectA11yBundle({
  a11yLabel,
  contentId,
  children,
  rest,
}: {
  a11yLabel: React.ReactNode;
  contentId: string;
  rest: SelectA11yShellRest;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {a11yLabel}
      {!open && <div id={contentId} role="listbox" hidden aria-hidden="true" />}
      <SelectContentIdContext.Provider value={contentId}>
        <SelectPrimitive.Root open={open} onOpenChange={setOpen} {...rest}>
          {children}
        </SelectPrimitive.Root>
      </SelectContentIdContext.Provider>
    </>
  );
}

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const contentId = useContext(SelectContentIdContext);

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'border-control-border ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-[5px] text-sm whitespace-nowrap shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        className,
      )}
      {...props}
      aria-controls={contentId ?? props['aria-controls']}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <ChevronUpIcon />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <ChevronDown />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => {
  const contentId = useContext(SelectContentIdContext);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        id={contentId ?? props.id}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border font-sans shadow-md',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          fontSans.variable,
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'focus:bg-primary focus:text-primary-foreground data-[highlighted]:bg-primary data-[highlighted]:text-primary-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:font-medium',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('bg-muted -mx-1 my-1 h-px', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
