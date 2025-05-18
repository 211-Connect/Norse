import { Header } from '@/components/header';
import { routing } from '@/i18n/routing';
import { AppConfigProvider } from '@/lib/context/app-config-context';
import { fetchAppConfig } from '@/lib/server/fetch-app-config';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { Providers } from '@/lib/providers';
import { getThemeColors } from '@/utils/get-theme-colors';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { Footer } from '@/components/footer';
import { getDirection } from '@/i18n/get-direction';
import { fontSans } from '@/styles/fonts';
import { LocationStoreProvider } from '@/lib/context/location-context/location-store-provider';
import '../../styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { data: appConfig } = await fetchAppConfig();

  const faviconUrl = appConfig?.favicon?.url ?? '/favicon.ico';

  return {
    title: appConfig?.brandName,
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const dir = getDirection(locale);

  const { data: appConfig } = await fetchAppConfig();

  const primaryColor = getThemeColors(appConfig?.theme.primaryColor ?? '');
  const secondaryColor = getThemeColors(appConfig?.theme.secondaryColor ?? '');

  return (
    <html lang={locale} dir={dir}>
      <body
        className={cn(
          'flex min-h-screen flex-col bg-primary/5 font-sans antialiased',
          fontSans.variable,
        )}
        style={
          {
            '--radius': appConfig?.theme.borderRadius,
            '--primary': primaryColor.color,
            '--primary-foreground': primaryColor.foregroundColor,
            '--secondary': secondaryColor.color,
            '--secondary-foreground': secondaryColor.foregroundColor,
          } as React.CSSProperties
        }
      >
        <NextIntlClientProvider>
          <AppConfigProvider value={appConfig}>
            <Providers>
              <Header />
              <LocationStoreProvider searchTerm="">
                {children}
              </LocationStoreProvider>
              <Footer />
              <Toaster />
            </Providers>
          </AppConfigProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
