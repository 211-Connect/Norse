'use client';

import { Locate } from 'lucide-react';
import { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/app/(app)/shared/lib/utils';

import { SEARCH_DIALOG_ID } from '../../lib/constants';
import { Button } from '../ui/button';

export interface AddMyLocationButtonProps {
  className?: string;
  variant?: 'link' | 'ghost';
  location?: string;
  onClick?: () => void;
  /** Optional ref for focus return when a parent dialog closes (e.g. main search layout). */
  buttonRef?: Ref<HTMLButtonElement>;
}

export function AddMyLocationButton({
  className = '',
  location,
  variant = 'ghost',
  onClick = () => {},
  buttonRef,
}: AddMyLocationButtonProps) {
  const { t } = useTranslation('common');
  const buttonLabel = location
    ? t('search.change_location_label', {
        location,
      })
    : t('search.add_my_location');

  return (
    <Button
      ref={buttonRef}
      onClick={onClick}
      className={cn(
        'flex h-auto gap-1 whitespace-normal text-left',
        variant === 'ghost' ? '!text-primary' : '!text-white',
        // When the button sits on a primary-colored surface (link variant), the
        // default near-black ring may be invisible against dark brand colours.
        // --ring-on-primary is computed server-side via getContrastColor and is
        // always guaranteed to be white or black depending on the tenant primary.
        variant === 'link' &&
          'focus-visible:ring-[hsl(var(--ring-on-primary))] focus-visible:ring-offset-[hsl(var(--primary))]',
        className,
      )}
      variant={variant}
      type="button"
      aria-controls={SEARCH_DIALOG_ID}
      aria-haspopup="dialog"
      aria-label={buttonLabel}
    >
      <Locate className="size-4" aria-hidden="true" />
      {location || t('search.add_my_location')}
    </Button>
  );
}
