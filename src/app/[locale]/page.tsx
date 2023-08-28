import FilterSection from 'src/components/organisms/FilterSection';

export default function Home() {
  return (
    <FilterSection name="home-page">
      <main>
        <FilterSection name="hero-section">
          <section className="bg-hero-image-mobile sm:bg-hero-image-tablet lg:bg-hero-image-desktop bg-cover pt-20 pb-20"></section>
        </FilterSection>
      </main>
    </FilterSection>
  );
}
