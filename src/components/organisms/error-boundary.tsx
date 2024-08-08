import React, { ReactNode } from 'react';
import { Title, Text, Button, Stack } from '@mantine/core';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { withAppConfig } from '@/shared/hoc/withAppConfig';

type Props = {
  children: ReactNode;
  appConfig?: any;
};

type State = {
  hasError: false;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    // Define a state variable to track whether is an error or not
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI

    return { hasError: true };
  }

  async componentDidCatch(error: any, errorInfo: any) {
    // You can use your own error logging service here
    console.log({ error, errorInfo });

    try {
      await axios.post('/api/webhook', {
        message: error?.message,
        brandName: this.props?.appConfig?.brand?.name,
        faviconUrl: this.props?.appConfig?.brand?.faviconUrl,
        url: window?.location?.href,
        openGraphUrl: this.props?.appConfig?.brand?.openGraphUrl,
        hostname: window?.location?.hostname,
      });
    } catch (err) {
      console.log('Unable to send webhook');
    }
  }

  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Stack sx={{ position: 'relative', minHeight: '100vh' }}>
          <Image
            fill
            src="/undraw_bug_fixing.svg"
            alt=""
            style={{
              objectFit: 'contain',
              zIndex: -1,
              objectPosition: 'center',
            }}
          />

          <Stack
            spacing="xl"
            pt="100px"
            pb="100px"
            bg="rgba(0,0,0,0.5)"
            align="center"
            justify="center"
            h="100vh"
          >
            <Title color="white">An error has occurred</Title>

            <Text
              size="lg"
              align="center"
              color="white"
              weight={500}
              maw="500px"
            >
              Our development team has been notified and will be working on a
              fix.
            </Text>

            <Button size="md" component={Link} href="/">
              Back to home
            </Button>
          </Stack>
        </Stack>
      );
    }

    // Return children components in case of no error
    return this.props.children;
  }
}

export default withAppConfig(ErrorBoundary);
