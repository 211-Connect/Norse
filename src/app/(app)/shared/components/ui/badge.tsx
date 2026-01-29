'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/app/(app)/shared/lib/utils';
import { getContrastColor } from '@/utils/getContrastColor';
import { hexToRgba } from '@/utils/hexToRgba';
import { useIconComponent } from '@/app/(app)/shared/hooks/useIconComponent';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-[6px] text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-border bg-primary/5 text-black ',
        primary: 'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    VariantProps<typeof badgeVariants> {
  // Dynamic badge props (when not using variant)
  color?: string;
  icon?: string | null;
  tooltip?: string;
  badgeStyle?: 'bold' | 'light' | 'outline';
  label?: string;
}

function Badge({
  className,
  variant,
  color,
  icon,
  tooltip,
  badgeStyle,
  label,
  children,
  ...props
}: BadgeProps) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const badgeRef = React.useRef<HTMLSpanElement>(null);
  const IconComponent = useIconComponent(icon);

  const handleMouseEnter = () => {
    if (tooltip && badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setShowTooltip(true);
    }
  };

  // If variant is provided, use CVA-based rendering (static badges)
  if (variant) {
    return (
      <div className={cn(badgeVariants({ variant }), className)} {...props}>
        {children}
      </div>
    );
  }

  // Dynamic badge rendering (for resource badges with custom colors/icons)
  const getColorStyles = (): React.CSSProperties => {
    if (!color) return {};

    switch (badgeStyle) {
      case 'bold':
        return {
          backgroundColor: color,
          color: getContrastColor(color),
        };

      case 'light':
        return {
          backgroundColor: hexToRgba(color, 0.07),
          borderColor: hexToRgba(color, 0.1),
          color,
        };

      case 'outline':
        return {
          borderColor: hexToRgba(color, 0.2),
          color,
        };

      default:
        return {};
    }
  };

  const getDynamicStyles = (): React.CSSProperties => {
    const colorStyles = getColorStyles();
    const needsBorder = badgeStyle === 'light' || badgeStyle === 'outline';

    return {
      ...colorStyles,
      position: 'relative',
      display: 'inline-flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '3px',
      padding: '2px 6px',
      fontSize: '13px',
      fontWeight: 500,
      lineHeight: '17px',
      whiteSpace: 'nowrap',
      cursor: tooltip ? 'help' : 'default',
      ...(needsBorder && { border: '1px solid', boxSizing: 'border-box' }),
    };
  };

  return (
    <>
      <span
        ref={badgeRef}
        style={getDynamicStyles()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn('min-w-0 max-w-full', className)}
        {...props}
      >
        <span className="min-w-0 truncate">{label || children}</span>
        {IconComponent && (
          <IconComponent size={14} aria-hidden="true" className="shrink-0" />
        )}
      </span>
      {tooltip && showTooltip && tooltipPosition && (
        <span
          className="pointer-events-none fixed z-[9999] whitespace-nowrap"
          style={{
            top: `${tooltipPosition.top - 8}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 400,
            lineHeight: 'normal',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {tooltip}
          <span
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              borderWidth: '4px',
              borderStyle: 'solid',
              borderColor:
                'rgba(0, 0, 0, 0.9) transparent transparent transparent',
            }}
          />
        </span>
      )}
    </>
  );
}

export { Badge, badgeVariants };
