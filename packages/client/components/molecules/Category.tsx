import {
  Box,
  Card,
  Group,
  MantineTheme,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import Image from 'next/image';
import { NavLink } from '../atoms/NavLink';
import { Anchor } from '../atoms/Anchor';
import { useTranslation } from 'next-i18next';

type Props = {
  index: string;
  name: string;
  image?: string;
  href?: string;
  subcategories: any[];
  theme: MantineTheme;
};

export function Category({ index, image, href, subcategories, theme }: Props) {
  const { t } = useTranslation('dynamic');

  if (subcategories && subcategories.length > 0) {
    return (
      <Group align="flex-start" spacing="xs" noWrap>
        {image && (
          <Image
            src={image}
            alt=""
            width={80}
            height={0}
            style={{
              height: 'auto',
              width: '40px',
              marginRight: theme.spacing.md,
            }}
          />
        )}

        <Stack spacing="xs">
          <Title order={3} size="h4">
            {t(`categories.${index}`)}
          </Title>
          {subcategories.map((el, key) => (
            <Group key={el.name}>
              <NavLink
                key={el.name}
                label={t(`categories.${index}.subcategories.${key}`)}
                rightSection={
                  el.href ? (
                    <IconExternalLink size={theme.fontSizes.xs} />
                  ) : null
                }
                href={`${
                  el.href
                    ? el.href
                    : `/search?query=${encodeURIComponent(
                        el.query
                      )}&query_label=${encodeURIComponent(
                        t(`categories.${index}.subcategories.${key}`)
                      )}&query_type=${encodeURIComponent(el.query_type)}`
                }`}
                prefetch={false}
                target={el.href ? '_blank' : '_self'}
                rel={el.href ? 'noopener noreferrer' : ''}
              />
            </Group>
          ))}
        </Stack>
      </Group>
    );
  }

  return (
    <Card
      radius="md"
      component={Anchor}
      href={href || '/'}
      withBorder
      shadow="md"
      sx={{
        transition: 'transform 200ms ease',
        '&:focus': {
          outlineColor: theme.colors.primary,
          outlineWidth: '2px',
          outlineStyle: 'solid',
          outlineOffset: theme.spacing.md,
        },
        '&:focus,&:hover': {
          transform: 'scale(1.05)',
        },
      }}
    >
      <Card.Section>
        {image && (
          <Stack align="center" justify="center" pt="xl" pb="xl">
            <Box
              mt="md"
              mb="md"
              sx={{
                overflow: 'hidden',
                borderRadius: '100%',
                width: 75,
                height: 75,
                position: 'relative',
              }}
            >
              <Image
                src={image}
                alt=""
                fill
                style={{
                  objectFit: 'cover',
                }}
              />
            </Box>
          </Stack>
        )}
      </Card.Section>
      <Card.Section
        bg="primary"
        sx={(theme) => ({
          borderBottomLeftRadius: theme.radius.md,
          borderBottomRightRadius: theme.radius.md,
        })}
      >
        <Text size="lg" color="#fff" align="center">
          {t(`categories.${index}`)}
        </Text>
      </Card.Section>
    </Card>
  );
}
