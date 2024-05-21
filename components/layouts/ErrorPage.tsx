import { Title, Text, Button, Stack } from '@mantine/core';
import { useTranslation } from 'next-i18next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';

type Props = {
  metaTitle: string;
  metaDescription: string;
  headerSection: React.ReactNode;
  title: string;
  description: string;
  backgroundImage: string;
  footerSection: React.ReactNode;
};

export default function ErrorPageLayout(props: Props) {
  const { t } = useTranslation('page-500');

  return (
    <>
      <Head>
        <title>{props.metaTitle}</title>
        <meta name="description" content={props.metaDescription} />
      </Head>
      {props.headerSection}
      <Stack sx={{ position: 'relative' }}>
        <Image
          fill
          src={props.backgroundImage}
          alt=""
          style={{ objectFit: 'contain', zIndex: -1, objectPosition: 'center' }}
        />

        <Stack
          spacing="xl"
          pt="100px"
          pb="100px"
          bg="rgba(0,0,0,0.5)"
          align="center"
        >
          <Title color="white">{props.title}</Title>

          <Text size="lg" align="center" color="white" weight={500} maw="500px">
            {props.description}
          </Text>

          <Button size="md" component={Link} href="/">
            {t('back_to_home')}
          </Button>
        </Stack>
      </Stack>
      {props.footerSection}
    </>
  );
}
