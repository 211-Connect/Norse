import {
  ActionIcon,
  Button,
  Group,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { ContextModalProps, openContextModal } from '@mantine/modals';
import { useEffect, useRef, useState } from 'react';
import {
  IconBrandFacebook,
  IconBrandTwitter,
  IconDeviceMobileMessage,
  IconLink,
  IconMail,
  IconPrinter,
} from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import { useTranslation } from 'next-i18next';
import { ShortUrlAdapter } from '../../lib/adapters/ShortUrlAdapter';
import { useSession } from 'next-auth/react';
import { useAppConfig } from '../../lib/hooks/useAppConfig';

type Props = ContextModalProps<{
  shareContents: { title: string; body: string };
  printFn?: () => void;
}>;

export function ShareModal(props: Props) {
  const hasRun = useRef(false);
  const clipboard = useClipboard({ timeout: 500 });
  const session = useSession();
  const appConfig = useAppConfig();
  const [shortUrl, setShortUrl] = useState('');
  const { t } = useTranslation('common');

  useEffect(() => {
    (async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      const shortUrlAdapter = new ShortUrlAdapter();
      const { url } = await shortUrlAdapter.createShortUrl(
        window.location.href
      );

      setShortUrl(url);
    })();
  }, []);

  return (
    <>
      <Text>{t('modal.share.share_via')}</Text>
      <Group spacing="md" pt="md" pb="md">
        <Tooltip
          label={t('modal.share.facebook')}
          events={{ hover: true, focus: true, touch: false }}
          withArrow
        >
          <ActionIcon
            size="xl"
            variant="outline"
            color="primary"
            component="a"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shortUrl
            )}`}
            target="_blank"
            sx={{ borderRadius: '100%' }}
          >
            <IconBrandFacebook />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t('modal.share.twitter')}
          events={{ hover: true, focus: true, touch: false }}
          withArrow
        >
          <ActionIcon
            size="xl"
            variant="outline"
            color="primary"
            component="a"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              props.innerProps.shareContents.title + '\n' + shortUrl
            )}`}
            target="_blank"
            sx={{ borderRadius: '100%' }}
          >
            <IconBrandTwitter />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t('modal.share.sms')}
          events={{ hover: true, focus: true, touch: false }}
          withArrow
        >
          <ActionIcon
            size="xl"
            variant="outline"
            color="primary"
            sx={{ borderRadius: '100%' }}
            onClick={() => {
              if (!('sms' in appConfig.features)) {
                const userAgent = navigator.userAgent;
                const isIOS = /iPhone|iPad|iPod|Macintosh/i.test(userAgent);
                let smsLink = '';

                if (isIOS) {
                  smsLink = `sms:&body=\n${encodeURIComponent(
                    props.innerProps.shareContents.body + '\n\n' + shortUrl
                  )}`;
                } else {
                  smsLink = `sms:?body=\n${encodeURIComponent(
                    props.innerProps.shareContents.body + '\n\n' + shortUrl
                  )}`;
                }

                window.location.href = smsLink;
              } else if (!session.data) {
                openContextModal({
                  modal: 'prompt-auth',
                  centered: true,
                  title: t('modal.prompt_auth', { ns: 'common' }),
                  size: 320,
                  innerProps: {},
                });
              } else {
                openContextModal({
                  modal: 'sms',
                  centered: true,
                  size: 320,
                  innerProps: {
                    shareContents: {
                      body:
                        props.innerProps.shareContents.title + '\n' + shortUrl,
                    },
                  },
                });
              }
            }}
          >
            <IconDeviceMobileMessage />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t('modal.share.email')}
          events={{ hover: true, focus: true, touch: false }}
          withArrow
        >
          <ActionIcon
            size="xl"
            variant="outline"
            color="primary"
            component="a"
            href={`mailto:?subject=${encodeURIComponent(
              props.innerProps.shareContents.title
            )}&body=${encodeURIComponent(
              props.innerProps.shareContents.body + '\n\n' + shortUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ borderRadius: '100%' }}
          >
            <IconMail />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t('modal.share.print')}
          events={{ hover: true, focus: true, touch: false }}
          withArrow
        >
          <ActionIcon
            size="xl"
            variant="outline"
            color="primary"
            sx={{ borderRadius: '100%' }}
            onClick={() => props.innerProps.printFn?.()}
          >
            <IconPrinter />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Text>{t('modal.share.copy_link')}</Text>
      <TextInput
        icon={<IconLink />}
        value={shortUrl}
        rightSectionWidth={75}
        readOnly
        rightSection={
          <Button
            compact
            color={clipboard.copied ? 'green' : 'primary'}
            onClick={() => clipboard.copy(shortUrl)}
          >
            {clipboard.copied ? t('modal.share.copied') : t('modal.share.copy')}
          </Button>
        }
      />
    </>
  );
}
