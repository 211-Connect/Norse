import { appWithTranslation } from 'next-i18next';
import { PageView } from '../components/page-view';
import Head from 'next/head';
import { GoogleTagManagerScript } from '@/components/google-tag-manager-script';
import { useAppConfig } from '../lib/hooks/useAppConfig';
import { AppProps } from 'next/app';
import { Open_Sans as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import Providers from '@/components/providers';
import '../styles/globals.css';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const appConfig = useAppConfig();

  return (
    <div
      className={cn(
        'min-h-screen bg-background font-sans antialiased',
        fontSans.variable
      )}
    >
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={appConfig?.brand?.faviconUrl ?? '/favicon'} />
      </Head>

      <PageView />

      <Providers session={session}>
        <Component {...pageProps} />
        <GoogleTagManagerScript />
      </Providers>
    </div>
  );
}

export default appWithTranslation(App);
