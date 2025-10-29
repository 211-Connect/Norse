'use client';

/* eslint-disable @next/next/no-html-link-for-pages */
import React, { ReactNode } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { buttonVariants } from '@/app/(app)/shared/components/ui/button';
import { LocalizedLink } from '@/app/(app)/shared/components/LocalizedLink';

// Create a wrapper component that has access to router
function ErrorBoundaryWithRouter({
  children,
  appConfig,
  basePath,
}: {
  children: ReactNode;
  appConfig?: any;
  basePath?: string;
}) {
  return (
    <ErrorBoundary appConfig={appConfig} basePath={basePath}>
      {children}
    </ErrorBoundary>
  );
}

type Props = {
  children: ReactNode;
  appConfig?: any;
  basePath?: string;
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

  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private checkHardwareAcceleration(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
      return 'unknown';
    } catch (e) {
      return 'unavailable';
    }
  }

  async componentDidCatch(error: any, errorInfo: any) {
    // You can use your own error logging service here
    console.log({ error, errorInfo });

    // Capture additional debugging info for coordinate errors
    const debugInfo = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      geolocationSupported: 'geolocation' in navigator,
      webglSupported: this.checkWebGLSupport(),
      hardwareAcceleration: this.checkHardwareAcceleration(),
      platform: navigator?.platform || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
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
      return (
        <div className="relative flex min-h-screen flex-col">
          <Image
            fill
            src="/images/undraw_bug_fixing.svg"
            alt="Bug fixing illustration"
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

            <a className={buttonVariants()} href="/">
              Back to home
            </a>
          </div>
        </div>
      );
    }

    // Return children components in case of no error
    return this.props.children;
  }
}

// Export the wrapper component
export { ErrorBoundaryWithRouter as ErrorBoundary };
