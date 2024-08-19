import { useTranslation } from 'next-i18next';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';

type AddToFavoritesButtonProps = {
  size?: 'default' | 'icon';
};

export function AddToFavoritesButton({
  size = 'default',
}: AddToFavoritesButtonProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Button
        className="flex gap-1"
        size={size}
        aria-label={t('call_to_action.add_to_list')}
      >
        <Heart className="size-4" />
        {size !== 'icon' && t('call_to_action.add_to_list')}
      </Button>
    </>
  );
}
