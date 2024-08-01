import { Group, Button } from '@mantine/core';
import { openContextModal } from '@mantine/modals';
import { IconChevronLeft, IconShare, IconHeartPlus } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';

type Props = {
  backUrl: 'loading' | string;
  resourceId: string;
  displayName: string;
  serviceDescription: string;
  componentToPrint: any;
};

export function ResourceNavigationSection(props: Props) {
  const { t } = useTranslation('page-resource');
  const { status } = useSession();
  const handlePrint = useReactToPrint({
    content: () => props.componentToPrint.current,
  });

  return (
    <Group
      w="100%"
      maw="1100px"
      m="0 auto"
      pl="md"
      pr="md"
      pt="md"
      position="apart"
    >
      <Button
        disabled={props.backUrl === 'loading'}
        component={Link}
        href={props.backUrl}
        variant="light"
        size="xs"
        leftIcon={<IconChevronLeft />}
      >
        {props.backUrl === '/' ? t('back_to_home') : t('back_to_results')}
      </Button>

      <Group noWrap spacing="sm">
        <Button
          fullWidth
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
                  title: t('check_out_this_resource', { ns: 'common' }),
                  body: `${props.displayName}\n\n${props.serviceDescription}`,
                },
                printFn: handlePrint,
              },
            });
          }}
        >
          {t('call_to_action.share', { ns: 'common' })}
        </Button>

        <Button
          fullWidth
          variant="light"
          size="xs"
          leftIcon={<IconHeartPlus />}
          onClick={async () => {
            if (status === 'unauthenticated') {
              openContextModal({
                title: t('modal.prompt_auth', { ns: 'common' }),
                modal: 'prompt-auth',
                centered: true,
                size: 320,
                innerProps: {},
              });
            } else if (status === 'authenticated') {
              openContextModal({
                modal: 'add-to-favorites',
                centered: true,
                innerProps: {
                  serviceAtLocationId: props.resourceId,
                },
              });
            }
          }}
        >
          {t('call_to_action.add_to_list', { ns: 'common' })}
        </Button>
      </Group>
    </Group>
  );
}
