'use client';

import { useAuth } from '@payloadcms/ui';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientUser } from 'payload';

function isInternalUser(user: ClientUser | null | undefined): boolean {
  if (user == null || typeof user !== 'object') {
    return false;
  }

  return (
    Array.isArray(user.roles) &&
    user.roles.some((role) => role === 'super-admin' || role === 'support')
  );
}

export default function ScorecardsNavLink() {
  const pathname = usePathname();
  const href = '/admin/scorecards';
  const isActive = pathname?.startsWith(href);
  const { selectedTenantID } = useTenantSelection();
  const { user } = useAuth();

  if (!selectedTenantID || !isInternalUser(user)) {
    return null;
  }

  return (
    <Link
      className="nav__link"
      href={href}
      id="nav-scorecards"
      prefetch={false}
    >
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Scorecards</span>
    </Link>
  );
}
