import Image from 'next/image';
import HouseIcon from '../icons/House';
import HeartIcon from '../icons/Heart';
import Button from '../atoms/Button';
import Link from '../atoms/Link';
import FilterSection from './FilterSection';
import SearchIcon from '../icons/Search';

export default function Header() {
  return (
    <FilterSection name="header">
      <header className="min-h-20">
        <nav className="flex flex-col items-center justify-between pt-2 pb-2 sm:p-2 sm:flex-row container mx-auto">
          <FilterSection name="logo">
            <Link href="/">
              <Image
                src="/images/logo.png"
                width={400}
                height={200}
                alt="Back to home"
                className="h-16 w-auto"
                priority
              />
            </Link>
          </FilterSection>

          <FilterSection name="main-nav">
            <ul className="flex flex-col items-center gap-2 sm:flex-row">
              <li>
                <Link href="/" className="flex items-center gap-0.1">
                  <HouseIcon />
                  Home
                </Link>
              </li>
              <li>
                <Link href="/search" className="flex items-center gap-0.1">
                  <SearchIcon />
                  Search
                </Link>
              </li>
              <li>
                <Link
                  href="/account/favorites"
                  className="flex items-center gap-0.1"
                >
                  <HeartIcon />
                  Favorites
                </Link>
              </li>

              <li>
                <Button>Submit Feedback</Button>
              </li>
            </ul>
          </FilterSection>
        </nav>
      </header>
    </FilterSection>
  );
}
