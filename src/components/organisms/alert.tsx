import Link from 'next/link';
import { useAppConfig } from '../../lib/hooks/useAppConfig';
import { Button, Flex, Text } from '@mantine/core';

export default function Alert() {
  const appConfig = useAppConfig();

  if (appConfig.alert == null || Object.keys(appConfig.alert).length === 0)
    return null;

  return (
    <Flex
      w="100%"
      gap="md"
      justify="center"
      align="center"
      wrap="nowrap"
      bg="red"
      p="xl"
    >
      <Text color="#fff" size="xl">
        {appConfig.alert.text}
      </Text>

      {appConfig.alert?.buttonText != null && appConfig.alert?.url != null && (
        <Button component={Link} href={appConfig.alert.url}>
          {appConfig.alert.buttonText}
        </Button>
      )}
    </Flex>
  );
}
