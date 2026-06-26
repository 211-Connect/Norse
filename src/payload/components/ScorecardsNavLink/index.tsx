'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';

type ScorecardsStatusResponse = {
  tenantId: string;
  aiClassificationEnabled: boolean;
};

export default function ScorecardsNavLink() {
  const pathname = usePathname();
  const href = '/admin/scorecards';
  const isActive = pathname?.startsWith(href);
  const { selectedTenantID } = useTenantSelection();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkStatus = async () => {
      if (!selectedTenantID) {
        setIsVisible(false);
        return;
      }

      try {
        const result = await fetchWrapper<ScorecardsStatusResponse>(
          `/api/taxonomy-scorecards/status?tenantId=${encodeURIComponent(selectedTenantID)}`,
        );

        if (cancelled) {
          return;
        }

        setIsVisible(Boolean(result?.aiClassificationEnabled));
      } catch {
        if (!cancelled) {
          setIsVisible(false);
        }
      }
    };

    checkStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedTenantID]);

  if (!isVisible) {
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
