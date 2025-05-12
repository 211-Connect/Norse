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
import { getThemeColors } from '@/utils/get-theme-colors';

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
  const primaryColor = getThemeColors(appConfig?.theme.primaryColor ?? '');
  const secondaryColor = getThemeColors(appConfig?.theme.secondaryColor ?? '');

  return (
    <html lang={locale}>
      <body
        className={cn(
          'flex min-h-screen flex-col bg-primary/5 font-sans antialiased',
          fontSans.variable,
        )}
        style={
          {
            '--radius': appConfig?.theme.borderRadius ?? '0.5rem',
            '--primary': `${primaryColor.color[0]} ${primaryColor.color[1]}% ${primaryColor.color[2]}%`,
            '--primary-foreground': primaryColor.foregroundColor,
            '--secondary': `${secondaryColor.color[0]} ${secondaryColor.color[1]}% ${secondaryColor.color[2]}%`,
            '--secondary-foreground': secondaryColor.foregroundColor,
          } as React.CSSProperties
        }
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
