'use client';
import { HeroSection } from '../components/hero-section';
import { CategoriesSection } from '../components/categories-section';
import { DataProviders } from '@/shared/components/data-providers';
import Alert from '../components/alert';

export function HomeView() {
  return (
    <>
      <HeroSection />
      <div className="bg-primary/5">
        <Alert />
        <CategoriesSection />
      </div>

      <DataProviders />
    </>
  );
}
