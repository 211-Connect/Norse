import {
  Button,
  Card,
  Flex,
  Pagination,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import Color from 'color';
import { FavoriteList } from 'components/molecules/FavoriteList';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';

type Props = {
  favoriteLists: any[];
};

export function FavoriteListSection(props: Props) {
  const { t } = useTranslation('page-favorites');

  return (
    <>
      <Flex p="md">
        <Button
          onClick={() => {
            openContextModal({
              modal: 'create-list',
              title: t('modal.create_list.create_a_list', { ns: 'common' }),
              centered: true,
              innerProps: {
                t: t,
              },
            });
          }}
        >
          {t('modal.create_list.create_a_list', { ns: 'common' })}
        </Button>
      </Flex>

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
          {props.favoriteLists.length} {t('lists')}
        </Text>
      </Flex>

      <Stack spacing="md" pr="md" pl="md">
        {props.favoriteLists.map((el: any) => (
          <FavoriteList
            key={el._id}
            id={el._id}
            name={el.name}
            description={el.description}
            privacy={el.privacy}
          />
        ))}

        {props.favoriteLists.length === 0 && (
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Flex justify="center">
              <Image
                src="/undraw_no_data.svg"
                width={0}
                height={150}
                alt=""
                style={{ height: '150px', width: 'auto' }}
              />
            </Flex>

            <Title color="primary" order={3} align="center" mt="md" mb="md">
              {t('no_lists')}
            </Title>
          </Card>
        )}
      </Stack>

      <Pagination
        total={0}
        m="0 auto"
        mb="md"
        onChange={() => {}}
        initialPage={0}
      />
    </>
  );
}
