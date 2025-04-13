import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ConfigStoreProvider } from '@/lib/context/config-context/config-store-provider';
import '@/shared/styles/globals.css';
import { cn } from '@/shared/lib/cn-utils';
import { fontSans } from '@/shared/styles/fonts';
import { Footer } from '@/shared/components/footer';
import { Header } from '@/shared/components/header';
import { SearchStoreProvider } from '@/lib/context/search-context/search-store-provider';
import { QueryClientProvider } from '@/lib/context/query-client-context/query-client-provider';

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

  return (
    <html lang={locale}>
      <body
        className={cn(
          'bg-primary/5 flex min-h-screen flex-col font-sans antialiased',
          fontSans.variable,
        )}
      >
        <QueryClientProvider>
          <ConfigStoreProvider>
            <SearchStoreProvider>
              <NextIntlClientProvider>
                <Header />
                <main className="flex flex-1 flex-col">{children}</main>
                <Footer />
              </NextIntlClientProvider>
            </SearchStoreProvider>
          </ConfigStoreProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
