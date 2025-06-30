import React, { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { buttonVariants } from '@/shared/components/ui/button';

type Props = {
  children: ReactNode;
  appConfig?: any;
};

type State = {
  hasError: false;
};

export class ErrorBoundary extends React.Component<Props, State> {
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

    // Capture additional debugging info for coordinate errors
    const debugInfo = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      geolocationSupported: 'geolocation' in navigator,
    };

    try {
      await axios.post('/api/webhook', {
        message: error?.message,
        brandName: this.props?.appConfig?.brand?.name,
        faviconUrl: this.props?.appConfig?.brand?.faviconUrl,
        url: window?.location?.href,
        openGraphUrl: this.props?.appConfig?.brand?.openGraphUrl,
        hostname: window?.location?.hostname,
        debugInfo: JSON.stringify(debugInfo),
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
        <div className="relative flex min-h-screen flex-col">
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

          <div className="flex h-screen flex-col items-center justify-center bg-black/50 pb-28 pt-28">
            <h1 className="text-xl font-bold text-white">
              An error has occurred
            </h1>

            <p className="max-w-[500px] text-center text-lg font-semibold text-white">
              Our development team has been notified and will be working on a
              fix.
            </p>

            <Link className={buttonVariants()} href="/">
              Back to home
            </Link>
          </div>
        </div>
      );
    }

    // Return children components in case of no error
    return this.props.children;
  }
}
