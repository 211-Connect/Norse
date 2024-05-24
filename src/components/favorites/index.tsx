import { openContextModal } from '@mantine/modals';
import {
  IconChevronLeft,
  IconEdit,
  IconShare,
  IconTrash,
} from '@tabler/icons-react';
import { Favorite } from './favorite';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useReactToPrint } from 'react-to-print';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  deleteFavoriteListDialogAtom,
  favoriteListWithFavoritesAtom,
  updateFavoriteListDialogAtom,
} from './state';
import { Badge } from '../ui/badge';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useSession } from 'next-auth/react';
import { Anchor } from '../anchor';
import { cn } from '@/lib/utils';
import DeleteFavoriteList from './modals/delete-favorite-list';
import { UpdateFavoriteListModal } from './modals/update-favorite-list';
import DeleteFavorite from './modals/delete-favorite';

export function FavoritesSection() {
  const { t } = useTranslation('common');
  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });
  const { data, isLoading, isFetching } = useAtomValue(
    favoriteListWithFavoritesAtom
  );
  const setDeleteFavoriteList = useSetAtom(deleteFavoriteListDialogAtom);
  const setUpdateFavoriteList = useSetAtom(updateFavoriteListDialogAtom);
  const session = useSession();
  const viewingAsOwner = session?.data?.user?.id;

  if (!data || isLoading || isFetching) return null;

  return (
    <div ref={componentRef}>
      <div className="bg-card p-2 flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <Badge>{t(`list.${data?.privacy?.toLowerCase()}`)}</Badge>

          {viewingAsOwner && (
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="outline"
                aria-label={t('modal.update_list.update_list')}
                onClick={() =>
                  setUpdateFavoriteList({
                    isOpen: true,
                    list: data,
                    title: t('modal.update_list.update_list'),
                  })
                }
              >
                <IconEdit className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                aria-label={t('call_to_action.delete_list')}
                onClick={() => {
                  setDeleteFavoriteList({
                    isOpen: true,
                    id: data._id,
                    name: data.name,
                  });
                }}
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold text-primary">{data.name}</h3>
        <p>{data.description}</p>

        <div className="flex justify-between items-center">
          {viewingAsOwner && (
            <Anchor
              className={cn(buttonVariants({ variant: 'outline' }), 'gap-1')}
              href="/favorites"
            >
              <IconChevronLeft className="size-4" />
              {t('back_to_favorites', { ns: 'page-list' })}
            </Anchor>
          )}

          <Button
            className="gap-1"
            variant="outline"
            onClick={async () => {
              openContextModal({
                modal: 'share',
                centered: true,
                size: 320,
                innerProps: {
                  shareContents: {
                    title: t('modal.share.check_out_this_list'),
                    body: ``,
                  },
                  printFn: handlePrint,
                },
              });
            }}
          >
            <IconShare className="size-4" />
            {t('call_to_action.share')}
          </Button>
        </div>
      </div>

      <div className="flex justify-end items-center bg-primary p-2 pt-1 pb-1">
        <p id="result-total" className="text-primary-foreground">
          {data?.favorites?.length} {t('favorites', { ns: 'page-list' })}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-2">
        {data?.favorites?.map((resource: any) => {
          const address = resource?.addresses?.find(
            (el: any) => el.type === 'physical'
          );

          const mainAddress = address
            ? `${address.address_1}, ${address.city}, ${address.stateProvince} ${address.postalCode}`
            : null;

          return (
            <Favorite
              key={resource._id}
              id={resource._id}
              favoriteListId={data._id}
              address={mainAddress}
              displayName={resource.displayName}
              displayPhoneNumber={resource.displayPhoneNumber}
              location={resource.location}
              addresses={resource.addresses}
              phoneNumbers={resource.phoneNumbers}
              serviceName={resource.translations?.[0]?.serviceName}
              serviceDescription={
                resource.translations?.[0]?.serviceDescription ?? ''
              }
              languages={resource.languages}
              email={resource.email}
              phone={resource.phone}
              website={resource.website}
              hours={resource.hours}
            />
          );
        })}

        {data?.favorites?.length === 0 && (
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
              <div className="flex justify-center">
                <Image
                  src="/undraw_no_data.svg"
                  alt=""
                  height={150}
                  width={0}
                  className="h-[150px] w-auto"
                />
              </div>

              <h3
                className="text-primary font-semibold text-center text-2xl"
                color="primary"
              >
                {t('no_favorites.title', { ns: 'page-list' })}
              </h3>

              <Link href="/search">
                {t('no_favorites.subtitle', { ns: 'page-list' })}
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      <DeleteFavoriteList />
      <UpdateFavoriteListModal />
      <DeleteFavorite />
    </div>
  );
}
