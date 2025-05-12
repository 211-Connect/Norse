import { Header } from '@/components/header';
import { routing } from '@/i18n/routing';
import { AppConfigProvider } from '@/lib/context/app-config-context';
import { getAppConfig } from '@/lib/server/get-app-config';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { fontSans } from '@/shared/styles/fonts';
import { cn } from '@/shared/lib/utils';
import '../../shared/styles/globals.css';
import { Providers } from '@/lib/providers';

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

  const { data: appConfig } = await getAppConfig();

  return (
    <html lang={locale}>
      <body
        className={cn(
          'flex min-h-screen flex-col bg-primary/5 font-sans antialiased',
          fontSans.variable,
        )}
      >
        <NextIntlClientProvider>
          <AppConfigProvider value={appConfig}>
            <Providers>
              <Header />
              {children}
            </Providers>
          </AppConfigProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
