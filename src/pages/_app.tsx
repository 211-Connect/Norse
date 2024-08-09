import '@/shared/styles/globals.css';
import Head from 'next/head';
import { appWithTranslation } from 'next-i18next';
import { AppProps } from 'next/app';
import { Open_Sans } from 'next/font/google';
import { ErrorBoundary } from '@/shared/components/error-boundary';
import { cn } from '@/shared/lib/utils';
import { Header } from '@/shared/components/header';
import { Footer } from '@/shared/components/footer';
import { Providers } from '@/shared/components/providers';
import { GoogleTagManagerScript } from '@/shared/components/google-tag-manager-script';

const fontSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function App({
  Component,
  pageProps: { session, appConfig, ...pageProps },
}: AppProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Providers session={session} appConfig={appConfig}>
        <ErrorBoundary>
          <Header />
          <main
            className={cn('font-sans antialiased flex-1', fontSans.variable)}
          >
            <Component {...pageProps} />
          </main>
          <Footer />
          <GoogleTagManagerScript />
        </ErrorBoundary>
      </Providers>
    </div>
  );
}

export default appWithTranslation(App);
