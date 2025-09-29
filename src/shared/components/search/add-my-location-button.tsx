import { Locate } from 'lucide-react';
import { Button } from '../ui/button';
import { useTranslation } from 'next-i18next';
import { cn } from '@/shared/lib/utils';

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

  return (
    <Button
      onClick={onClick}
      className={cn('flex gap-1 !text-primary', className)}
      variant="ghost"
      type="button"
    >
      <Locate className="size-4" />
      {location || t('search.add_my_location')}
    </Button>
  );
}
