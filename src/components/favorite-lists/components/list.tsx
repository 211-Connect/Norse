import { Anchor } from '@/components/anchor';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'next-i18next';
import {
  deleteFavoriteListDialogAtom,
  updateFavoriteListDialogAtom,
} from '../state';
import { IFavoriteList } from '../types/FavoriteList';
import { Pencil, Trash2 } from 'lucide-react';

type Props = IFavoriteList;

export default function FavoriteList(props: Props) {
  const { t } = useTranslation('page-favorites');
  const setDeleteDialog = useSetAtom(deleteFavoriteListDialogAtom);
  const setUpdateDialog = useSetAtom(updateFavoriteListDialogAtom);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge>
            {t(`list.${props.privacy.toLowerCase()}`, { ns: 'common' })}
          </Badge>

          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              aria-label={t('modal.update_list.update_list', { ns: 'common' })}
              onClick={() =>
                setUpdateDialog({
                  isOpen: true,
                  title: t('modal.update_list.update_list', { ns: 'common' }),
                  list: props,
                })
              }
            >
              <Pencil size={18} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label={t('call_to_action.delete_list', { ns: 'common' })}
              onClick={() => {
                setDeleteDialog({
                  id: props._id,
                  name: props.name,
                  isOpen: true,
                });
              }}
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-primary">
          <Anchor href={`/favorites/${props._id}`}>{props.name}</Anchor>
        </h3>

        <p className="text-sm">{props.description}</p>
      </CardContent>

      <CardFooter className="items-center justify-end p-4 pt-2">
        <Anchor
          className={buttonVariants({ variant: 'default' })}
          href={`/favorites/${props._id}`}
        >
          {t('view_list')}
        </Anchor>
      </CardFooter>
    </Card>
  );
}
