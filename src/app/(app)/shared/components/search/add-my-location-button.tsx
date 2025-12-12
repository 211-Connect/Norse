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
}

export function AddMyLocationButton({
  className = '',
  location,
  variant = 'ghost',
  onClick = () => {},
}: AddMyLocationButtonProps) {
  const { t } = useTranslation('common');

  return (
    <Button
      onClick={onClick}
      className={cn(
        'flex gap-1',
        variant === 'ghost' ? '!text-primary' : '!text-white',
        className,
      )}
      variant={variant}
      type="button"
    >
      <Locate className="size-4" />
      {location || t('search.add_my_location')}
      <input
        className="absolute h-full w-full cursor-pointer opacity-0"
        aria-label="change-location-input"
      />
    </Button>
  );
}
