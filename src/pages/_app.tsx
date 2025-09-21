import '@/shared/styles/globals.css';
import '@/shared/styles/map.css';
import Head from 'next/head';
import { appWithTranslation } from 'next-i18next';
import { AppProps } from 'next/app';
import { ErrorBoundary } from '@/features/error/components/error-boundary';
import { cn } from '@/shared/lib/utils';
import { Header } from '@/shared/components/header';
import { Footer } from '@/shared/components/footer';
import { Providers } from '@/shared/components/providers';
import { GoogleTagManagerScript } from '@/shared/components/google-tag-manager-script';
import { Toaster } from '@/shared/components/ui/sonner';
import { JotaiHydration } from '@/shared/components/jotai-hydration';
import { GlobalDialogs } from '@/shared/components/global-dialogs/global-dialogs';
import { fontSans } from '@/shared/styles/fonts';

function App({
  Component,
  pageProps: { session, appConfig, flags, ...pageProps },
}: AppProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-primary/5 font-sans antialiased',
        fontSans.variable,
      )}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href={appConfig?.brand?.faviconUrl ?? '/favicon.ico'}
        />
      </Head>

      <Providers session={session} appConfig={appConfig} flags={flags}>
        <JotaiHydration pageProps={pageProps} />

        <ErrorBoundary>
          <Header />
          <main className="flex flex-1 flex-col">
            <Component {...pageProps} />
          </main>
          <Footer />
          <GlobalDialogs />
          <Toaster />
          <GoogleTagManagerScript />
        </ErrorBoundary>
      </Providers>
    </div>
  );
}

export default appWithTranslation(App);
