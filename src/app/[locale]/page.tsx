import { NextIntlClientProvider } from 'next-intl';
import { loadMessages } from '@/lib/server/load-messages';
import { HeroSection } from '@/features/home/components/hero-section';
import { fetchSuggestions } from '@/lib/server/fetch-suggestions';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { fetchCategories } from '@/lib/server/fetch-categories';
import { CategoriesProvider } from '@/lib/context/categories-context';
import { CategoriesSection } from '@/features/home/components/categories-section';
import Alert from '@/features/home/components/alert';
import { DataProviders } from '@/shared/components/data-providers';

export default async function HomePage() {
  const messages = await loadMessages('home');
  const { data: suggestions } = await fetchSuggestions();
  const { data: categories } = await fetchCategories();

  return (
    <NextIntlClientProvider messages={messages}>
      <SuggestionsProvider value={suggestions}>
        <CategoriesProvider value={categories}>
          <HeroSection />
          <Alert />
          <CategoriesSection />
          <DataProviders />
        </CategoriesProvider>
      </SuggestionsProvider>
    </NextIntlClientProvider>
  );
}
