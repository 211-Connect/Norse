import { NextIntlClientProvider } from 'next-intl';
import { loadMessages } from '@/lib/server/load-messages';
import { fetchSuggestions } from '@/lib/server/fetch-suggestions';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { fetchCategories } from '@/lib/server/fetch-categories';
import { CategoriesProvider } from '@/lib/context/categories-context';
import { CategoriesSection } from '@/features/home/components/categories-section';
import Alert from '@/features/home/components/alert';
import { DataProviders } from '@/shared/components/data-providers';
import { HomePageTemplate } from '@/features/home/templates/home-page-template';

export default async function HomePage() {
  const [messages, { data: suggestions }, { data: categories }] =
    await Promise.all([
      loadMessages('home'),
      fetchSuggestions(),
      fetchCategories(),
    ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <SuggestionsProvider value={suggestions}>
        <CategoriesProvider value={categories}>
          <HomePageTemplate />
        </CategoriesProvider>
      </SuggestionsProvider>
    </NextIntlClientProvider>
  );
}
