import { HeroSection } from '../components/hero-section';
import Alert from '../components/alert';
import { CategoriesSection } from '../components/categories-section';
import { DataProviders } from '@/shared/components/data-providers';

export function HomePageTemplate() {
  return (
    <>
      <HeroSection />
      <Alert />
      <CategoriesSection />
      <DataProviders />
    </>
  );
}
