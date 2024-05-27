import { createContext, useContext } from 'react';

const categoriesContext = createContext<any[]>([]);

export const CategoriesProvider = categoriesContext.Provider;

export function useCategories() {
  const categories = useContext(categoriesContext);
  return categories as any; // COME BACK AND TYPE THIS
}
