'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn-utils';
import { useFilterPanel } from '@/lib/context/filter-panel-context';
import { Filter } from 'lucide-react';

type ToggleFilterPanelButtonProps = {
  filterKeys: string[];
};

export function ToggleFilterPanelButton({
  filterKeys,
}: ToggleFilterPanelButtonProps) {
  const { setOpen } = useFilterPanel();

  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn(
        filterKeys.length > 0 ? 'flex xl:hidden' : 'hidden',
        'gap-1',
      )}
      onClick={() => setOpen(true)}
    >
      <Filter size={16} />
      Filter
    </Button>
  );
}
