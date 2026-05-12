'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
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
            'group toast !bg-background !text-foreground !border-border !shadow-lg',
          description: '!text-foreground',
          actionButton: '!bg-primary !text-primary-foreground',
          cancelButton: '!bg-muted !text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
