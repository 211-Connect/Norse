'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();
  const toasterRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const toasterElement = toasterRef.current;

    if (!toasterElement) {
      return;
    }

    const removeAriaLabel = () => {
      toasterElement.removeAttribute('aria-label');
    };

    removeAriaLabel();

    const observer = new MutationObserver(removeAriaLabel);

    observer.observe(toasterElement, {
      attributeFilter: ['aria-label'],
      attributes: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Sonner
      ref={toasterRef}
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
