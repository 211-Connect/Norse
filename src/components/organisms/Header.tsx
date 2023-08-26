import Link from 'next-intl/link';
import Image from 'next/image';
import HouseIcon from '../icons/House';
import HeartIcon from '../icons/Heart';
import Button from '../atoms/Button';

export default function Header() {
  return (
    <header className="min-h-20">
      <nav className="flex flex-col items-center justify-between pt-2 pb-2 sm:p-2 sm:flex-row">
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

        <ul className="flex flex-col items-center gap-2 sm:flex-row">
          <li>
            <Link href="/" className="flex items-center gap-0.1">
              <HouseIcon />
              Home
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
      </nav>
    </header>
  );
}
