import { Locate } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { cn } from '@/shared/lib/utils';

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
    </Button>
  );
}
