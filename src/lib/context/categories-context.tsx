'use client';
import { Category } from '@/types/category';
import { createContext, useContext } from 'react';

const categoriesContext = createContext<Category[] | undefined | null>(
  undefined,
);

type CategoriesProviderProps = {
  value: Category[] | null;
  children: React.ReactNode;
};

export function CategoriesProvider({
  value,
  children,
}: CategoriesProviderProps) {
  return (
    <categoriesContext.Provider value={value}>
      {children}
    </categoriesContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(categoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within an CategoriesProvider');
  }
  return context;
}
