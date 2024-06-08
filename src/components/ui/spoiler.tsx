import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Button } from './button';

type SpoilerProps = {
  children?: React.ReactNode;
  className?: string;
  hideLabel?: string;
  showLabel?: string;
};
export const Spoiler = ({
  children,
  className,
  hideLabel,
  showLabel,
}: SpoilerProps) => {
  const contentRef = useRef<HTMLDivElement>();
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const computedStyles = window.getComputedStyle(contentRef.current);
    const maxHeight = computedStyles.maxHeight;
    const height = computedStyles.height;

    if (height === maxHeight) {
      setShowButton(true);
    }
  }, []);

  return (
    <div>
      <div
        ref={contentRef}
        className={cn('overflow-hidden', isOpen ? null : 'max-h-32', className)}
      >
        {children}
      </div>
      {showButton && (
        <Button
          variant="link"
          className="p-0"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? hideLabel : showLabel}
        </Button>
      )}
    </div>
  );
};
