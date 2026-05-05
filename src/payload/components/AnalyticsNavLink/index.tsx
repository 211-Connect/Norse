'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AnalyticsNavLink() {
  const pathname = usePathname();
  const isActive = pathname?.startsWith('/admin/analytics');

  return (
    <Link
      href="/admin/analytics"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: 'var(--style-radius-m)',
        textDecoration: 'none',
        color: isActive ? 'var(--theme-text)' : 'var(--theme-elevation-800)',
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive
          ? 'var(--theme-elevation-100)'
          : 'transparent',
        transition: 'background-color 0.1s ease, color 0.1s ease',
        width: '100%',
        boxSizing: 'border-box',
        fontSize: '1rem',
        lineHeight: '20px',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'var(--theme-elevation-50)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
            'transparent';
        }
      }}
    >
      Analytics
    </Link>
  );
}
