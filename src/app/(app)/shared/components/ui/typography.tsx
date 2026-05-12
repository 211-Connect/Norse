'use client';

import { type VariantProps, cva } from 'class-variance-authority';
import { forwardRef } from 'react';

import { cn } from '../../lib/utils';
import { LocalizedLink } from '../LocalizedLink';

const typographyVariants = cva(
  'font-sans leading-none tracking-normal break-words', // Base: Inter font, 100% line-height, 0% letter-spacing, word breaking
  {
    variants: {
      variant: {
        heading: '',
        paragraph: '',
        label: '',
      },
      size: {
        md: '',
        sm: '',
        xs: '',
      },
      textColor: {
        default: 'text-foreground',
        primary: 'text-primary',
        secondary: 'text-muted-foreground',
      },
    },
    compoundVariants: [
      // Heading md: 20px, 600 (Semi Bold)
      {
        variant: 'heading',
        size: 'md',
        className: 'text-xl font-semibold',
      },
      // Heading sm: 16px, 500 (Medium)
      {
        variant: 'heading',
        size: 'sm',
        className: 'text-base font-medium',
      },
      // Heading xs: 14px, 500 (Medium)
      {
        variant: 'heading',
        size: 'xs',
        className: 'text-sm font-medium',
      },
      // Paragraph md: 16px, 400 (Regular)
      {
        variant: 'paragraph',
        size: 'md',
        className: 'text-base font-normal',
      },
      // Paragraph sm: 14px, 400 (Regular)
      {
        variant: 'paragraph',
        size: 'sm',
        className: 'text-sm font-normal',
      },
      // Paragraph xs: 12px, 400 (Regular)
      {
        variant: 'paragraph',
        size: 'xs',
        className: 'text-xs font-normal',
      },
      // Label sm: 14px, 600 (Semi Bold)
      {
        variant: 'label',
        size: 'sm',
        className: 'text-sm font-semibold',
      },
      // Label xs: 12px, 600 (Semi Bold)
      {
        variant: 'label',
        size: 'xs',
        className: 'text-xs font-semibold',
      },
    ],
    defaultVariants: {
      variant: 'paragraph',
      size: 'md',
      textColor: 'default',
    },
  },
);

export interface TypographyProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  asChild?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';
  url?: string | null;
  urlTarget?: '_blank' | '_self' | null;
}

const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      className,
      variant,
      size,
      textColor,
      as,
      children,
      url,
      urlTarget = '_self',
      ...props
    },
    ref,
  ) => {
    const Comp = getElement(as, variant, url);
    const isNextLink =
      url &&
      !url.startsWith('http') &&
      !url.startsWith('mailto:') &&
      !url.startsWith('tel:');

    if (isNextLink) {
      return (
        <LocalizedLink
          href={url}
          className={cn(
            typographyVariants({ variant, size, textColor, className }),
          )}
          ref={ref as React.Ref<HTMLAnchorElement>}
          target={urlTarget || undefined}
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </LocalizedLink>
      );
    }

    return (
      <Comp
        className={cn(
          typographyVariants({ variant, size, textColor, className }),
        )}
        ref={ref}
        href={url || null}
        target={urlTarget}
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

function getElement(
  as: TypographyProps['as'] | undefined,
  variant: 'heading' | 'paragraph' | 'label' | null | undefined,
  url: string | null | undefined,
): React.ElementType {
  if (as) {
    return as;
  }

  if (url) {
    return 'a';
  }

  switch (variant) {
    case 'heading':
      return 'h2';
    case 'label':
      return 'span';
    case 'paragraph':
    default:
      return 'p';
  }
}

Typography.displayName = 'Typography';

export { Typography, typographyVariants };
