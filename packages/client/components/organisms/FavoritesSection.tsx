import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Flex,
  Group,
  Paper,
  Stack,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { openConfirmModal, openContextModal } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import {
  IconTrash,
  IconInfoCircle,
  IconChevronLeft,
  IconEdit,
  IconShare,
} from '@tabler/icons-react';
import Color from 'color';
import { Anchor } from 'components/atoms/Anchor';
import { Favorite } from 'components/molecules/Favorite';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import { useTranslation } from 'next-i18next';
import { useReactToPrint } from 'react-to-print';
import { FavoriteAdapter } from '$lib/adapters/FavoriteAdapter';

type Props = {
  favoriteList: {
    _id: string;
    privacy: 'PUBLIC' | 'PRIVATE';
    name: string;
    description: string;
    favorites: any[];
  };
  viewingAsOwner: boolean;
};

export function FavoritesSection(props: Props) {
  const { t } = useTranslation('common');
  const componentRef = useRef(null);
  const theme = useMantineTheme();
  const router = useRouter();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const deleteList = (id: string, name: string) => {
    return async () => {
      openConfirmModal({
        title: `${t('modal.delete_list.delete_list')} ${name}?`,
        centered: true,
        labels: {
          confirm: t('call_to_action.delete'),
          cancel: t('call_to_action.cancel'),
        },
        confirmProps: {
          color: 'red',
        },
        onConfirm: async () => {
          try {
            const favoritesAdapter = new FavoriteAdapter();
            await favoritesAdapter.deleteFavoriteList(id);

            showNotification({
              title: `${name} ${t('text:deleted')}`,
              message: t('message:list-deleted'),
              color: 'green',
              icon: <IconTrash />,
            });

            router.push('/favorites');
          } catch (err) {
            showNotification({
              title: t('text:error'),
              message: t('error:list-not-deleted'),
              icon: <IconInfoCircle />,
              color: 'red',
            });
          }
        },
      });
    };
  };

  return (
    <>
      <Paper
        withBorder
        m="0"
        p="md"
        sx={{
          margin: 0,
          borderRadius: 0,
        }}
      >
        <Group position="apart">
          <Badge
            color={props.favoriteList.privacy === 'PRIVATE' ? 'red' : 'green'}
          >
            {t(`list.${props.favoriteList.privacy.toLowerCase()}`)}
          </Badge>

          {props.viewingAsOwner && (
            <Group spacing="xs">
              <ActionIcon
                aria-label={t('modal.update_list.update_list')}
                onClick={() =>
                  openContextModal({
                    modal: 'update-list',
                    title: t('modal.update_list.update_list'),
                    centered: true,
                    innerProps: {
                      list: props.favoriteList,
                    },
                  })
                }
              >
                <IconEdit size={18} />
              </ActionIcon>
              <ActionIcon
                aria-label={t('call_to_action.delete_list')}
                onClick={deleteList(
                  props.favoriteList._id,
                  props.favoriteList.name
                )}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Group>
          )}
        </Group>

        <Title color="primary" size="h3">
          {props.favoriteList.name}
        </Title>
        <Divider mb="md" mt="md" />
        <Text>{props.favoriteList.description}</Text>

        <Group position="apart">
          {props.viewingAsOwner && (
            <Button
              component={Anchor}
              href="/favorites"
              variant="light"
              size="xs"
              leftIcon={<IconChevronLeft />}
            >
              {t('back_to_favorites', { ns: 'page-list' })}
            </Button>
          )}

          <Button
            variant="light"
            size="xs"
            leftIcon={<IconShare />}
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
            {t('call_to_action.share')}
          </Button>
        </Group>
      </Paper>

      <Flex
        justify="flex-end"
        align="center"
        bg="primary"
        p="sm"
        pl="md"
        pr="md"
        mb="md"
      >
        <Text
          id="result-total"
          sx={(t) => ({
            color: Color(t.colors.primary).isDark() ? '#fff' : '#000',
          })}
        >
          {props.favoriteList.favorites.length}{' '}
          {t('favorites', { ns: 'page-list' })}
        </Text>
      </Flex>

      <Stack spacing="md" pr="md" pl="md">
        {props.favoriteList.favorites.map((resource: any) => {
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
              favoriteListId={props.favoriteList._id}
              address={mainAddress}
              locationName={resource.locationName}
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
              viewingAsOwner={props.viewingAsOwner}
              hours={resource.hours}
              theme={theme}
            />
          );
        })}
        {props.favoriteList.favorites.length === 0 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Flex justify="center">
              <Image
                src="/undraw_no_data.svg"
                alt=""
                height={150}
                width={0}
                style={{
                  height: '150px',
                  width: 'auto',
                }}
              />
            </Flex>

            <Title color="primary" order={3} align="center" mt="md" mb="md">
              {t('no_favorites.title', { ns: 'page-list' })}
            </Title>

            <Text align="center">
              <Link href="/search">
                {t('no_favorites.subtitle', { ns: 'page-list' })}
              </Link>
            </Text>
          </Card>
        )}
      </Stack>
    </>
  );
}
