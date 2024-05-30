import { appWithTranslation } from 'next-i18next';
import { PageView } from '../components/page-view';
import Head from 'next/head';
import { GoogleTagManagerScript } from '@/components/google-tag-manager-script';
import { AppProps } from 'next/app';
import { Open_Sans as FontSans } from 'next/font/google';
import { cn } from '@/utils';
import Providers from '@/components/providers';
import { Toaster } from 'sonner';
import '../styles/globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function App({
  Component,
  pageProps: { session, appConfig, ...pageProps },
}: AppProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable,
      )}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={appConfig?.brand?.faviconUrl ?? '/favicon'} />
      </Head>

      <PageView />

      <Providers session={session} appConfig={appConfig}>
        <Component {...pageProps} />
        <Toaster />
        <GoogleTagManagerScript />
      </Providers>
    </div>
  );
}

// We use dynamic runtime environment variables
// Due to this we need to make sure the application is dynamically rendered for all pages
App.getInitialProps = async () => {
  return {};
};

export default appWithTranslation(App);
