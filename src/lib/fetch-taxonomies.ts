export async function fetchTaxonomies(searchTerm: string, locale: string) {
  const response = await fetch(
    `/api/taxonomy?query=${searchTerm}&locale=${locale}`,
  );

  if (!response.ok) {
    return { data: null, error: 'Unable to fetch taxonomies' };
  }

  const { data } = await response.json();

  return { data, error: null };
}
