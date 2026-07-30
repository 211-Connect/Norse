'use client';

import Link from 'next/link';

import './styles.css';

export default function AnalyticsNavLink() {
  const href = '/admin';

  return (
    <Link className="nav__link" href={href} id="nav-analytics" prefetch={false}>
      <span className="nav__link-label">Analytics</span>
    </Link>
  );
}
