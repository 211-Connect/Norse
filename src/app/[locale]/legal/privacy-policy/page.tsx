import { fetchSuggestions } from '@/lib/server/fetch-suggestions';
import { SuggestionsProvider } from '@/lib/context/suggestions-context';
import { fetchCategories } from '@/lib/server/fetch-categories';
import { CategoriesProvider } from '@/lib/context/categories-context';
import { PrivacyPolicyTemplate } from '@/features/privacy-policy/templates/privacy-policy-template';

export default async function HomePage() {
  const [{ data: suggestions }, { data: categories }] = await Promise.all([
    fetchSuggestions(),
    fetchCategories(),
  ]);

  return (
    <SuggestionsProvider value={suggestions}>
      <CategoriesProvider value={categories}>
        <PrivacyPolicyTemplate />
      </CategoriesProvider>
    </SuggestionsProvider>
  );
}
