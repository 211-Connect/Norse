'use client';

import { Locate } from 'lucide-react';
import { cn } from '@/app/shared/lib/utils';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';
import { useAppConfig } from '../../hooks/use-app-config';
interface AddMyLocationButtonProps {
  className?: string;
  location?: string;
  onClick?: () => void;
}

export function AddMyLocationButton({
  className = '',
  location,
  onClick = () => {},
}: AddMyLocationButtonProps) {
  const { t } = useTranslation('common');
  const { newLayout } = useAppConfig();

  return (
    <Button
      onClick={onClick}
      className={cn(
        'flex gap-1',
        newLayout?.enabled ? '!text-primary' : '!text-white',
        className,
      )}
      variant={newLayout?.enabled ? 'ghost' : 'link'}
      type="button"
    >
      <Locate className="size-4" />
      {location || t('search.add_my_location')}
    </Button>
  );
}
