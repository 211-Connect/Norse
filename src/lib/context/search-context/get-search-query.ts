import { Category } from '@/types/category';
import { Suggestion } from '@/types/suggestion';

export type SearchData = {
  categories: Category[];
  suggestions: Suggestion[];
  taxonomies: any[];
};

export function getSearchQuery(searchTerm: string, data: SearchData) {
  const query = getQuery(searchTerm, data);
  const queryType = getQueryType(searchTerm, query, data);
  const queryLabel = searchTerm;

  return { query, queryType, queryLabel };
}

function getQuery(
  searchTerm: string,
  { taxonomies, suggestions, categories }: SearchData,
) {
  const taxonomy = taxonomies.find(
    (taxonomy) => taxonomy.name.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (taxonomy) return taxonomy.code;

  const suggestion = suggestions.find(
    (suggestion) =>
      suggestion.displayName.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (suggestion) return suggestion.taxonomies;

  const category = categories.find(
    (category) =>
      category?.subcategories?.find(
        (subcategory) =>
          subcategory.name.toLowerCase() === searchTerm.toLowerCase(),
      ) ?? category.name.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (category && (category.query || category.href))
    return category?.query ?? category.href;

  return searchTerm;
}

function getQueryType(
  searchTerm: string,
  query: string,
  { taxonomies, suggestions, categories }: SearchData,
) {
  const taxonomy = taxonomies.find(
    (taxonomy) => taxonomy.name.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (taxonomy) return 'taxonomy';

  const suggestion = suggestions.find(
    (suggestion) =>
      suggestion.displayName.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (suggestion) return 'taxonomy';

  const category = categories.find(
    (category) =>
      category?.subcategories?.find(
        (subcategory) =>
          subcategory.name.toLowerCase() === searchTerm.toLowerCase(),
      ) ?? category.name.toLowerCase() === searchTerm.toLowerCase(),
  );
  if (category) return 'taxonomy';

  if (query.trim().length === 0) return '';
  if (query === searchTerm) return 'text';
  return 'taxonomy';
}
