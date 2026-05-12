'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AnalyticsNavLink() {
  const pathname = usePathname();
  const href = '/admin/analytics';
  const isActive = pathname?.startsWith(href);

  return (
    <Link className="nav__link" href={href} id="nav-analytics" prefetch={false}>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Analytics</span>
    </Link>
  );
}
