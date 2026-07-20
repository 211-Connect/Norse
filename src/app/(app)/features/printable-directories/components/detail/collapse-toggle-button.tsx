'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { cn } from '@/app/(app)/shared/lib/utils';

type CollapseToggleButtonProps = {
  isExpanded: boolean;
  onToggle: () => void;
  expandLabel: string;
  collapseLabel: string;
};

export function CollapseToggleButton({
  isExpanded,
  onToggle,
  expandLabel,
  collapseLabel,
}: CollapseToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? collapseLabel : expandLabel}
    >
      <ChevronDown
        className={cn(
          'size-4 transition-transform',
          !isExpanded && '-rotate-90',
        )}
        aria-hidden="true"
      />
    </Button>
  );
}
