import '@/shared/styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import Head from 'next/head';
import { GoogleTagManagerScript } from '../components/atoms/GoogleTagManagerScript';
import { AppProps } from 'next/app';
import ErrorBoundary from '../components/organisms/error-boundary';
import { Open_Sans } from 'next/font/google';
import { cn } from '@/shared/lib/utils';
import { Header } from '@/shared/components/header';
import { Footer } from '@/shared/components/footer';
import { Providers } from '@/shared/components/providers';

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
        <link rel="icon" href="/favicon" />
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
