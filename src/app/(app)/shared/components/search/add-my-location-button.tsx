'use client';

import { Locate } from 'lucide-react';
import { cn } from '@/app/(app)/shared/lib/utils';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
export interface AddMyLocationButtonProps {
  className?: string;
  variant?: 'link' | 'ghost';
  location?: string;
  onClick?: () => void;
  dialogId?: string;
}

export function AddMyLocationButton({
  className = '',
  location,
  variant = 'ghost',
  onClick = () => {},
  dialogId,
}: AddMyLocationButtonProps) {
  const { t } = useTranslation('common');
  const buttonLabel = location
    ? t('search.change_location_label', {
        defaultValue: 'Change location: {{location}}',
        location,
      })
    : t('search.add_my_location');

  return (
    <Button
      onClick={onClick}
      className={cn(
        'flex h-auto gap-1 whitespace-normal text-left',
        variant === 'ghost' ? '!text-primary' : '!text-white',
        className,
      )}
      variant={variant}
      type="button"
      aria-controls={dialogId}
      aria-haspopup="dialog"
      aria-label={buttonLabel}
    >
      <Locate className="size-4" aria-hidden="true" />
      {location || t('search.add_my_location')}
    </Button>
  );
}
