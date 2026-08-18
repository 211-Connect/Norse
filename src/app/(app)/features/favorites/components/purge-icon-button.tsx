'use client';

import { Eraser } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/app/(app)/shared/components/ui/button';

import { PurgeConfirmDialog } from './purge-confirm-dialog';

type PurgeIconButtonProps = {
  onConfirm: () => void | Promise<void>;
  testId?: string;
};

export function PurgeIconButton({
  onConfirm,
  testId = 'purge-list-btn',
}: PurgeIconButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <>
      <Button
        size="icon"
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid={testId}
      >
        <Eraser className="size-4" />
      </Button>
      <PurgeConfirmDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleConfirm}
      />
    </>
  );
}
