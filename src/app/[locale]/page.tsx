import { NextIntlClientProvider } from 'next-intl';
import { getPageMessages } from '@/lib/server/get-page-messages';
import { HeroSection } from '@/features/home/components/hero-section';
import { getSuggestions } from '@/lib/server/get-suggestions';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { getCategories } from '@/lib/server/get-categories';
import { CategoriesProvider } from '@/lib/context/categories-context';

export default async function HomePage() {
  const messages = await getPageMessages('home');
  const { data: suggestions } = await getSuggestions();
  const { data: categories } = await getCategories();

  return (
    <NextIntlClientProvider messages={messages}>
      <SuggestionsProvider value={suggestions}>
        <CategoriesProvider value={categories}>
          <HeroSection />
        </CategoriesProvider>
      </SuggestionsProvider>
    </NextIntlClientProvider>
  );
}
