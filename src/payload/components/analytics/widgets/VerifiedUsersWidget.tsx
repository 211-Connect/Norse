'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useEffect, useState } from 'react';

import type { AsyncData } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';

type VerifiedUsersData = {
  verifiedUsers: number;
};

function useVerifiedUsersData(): AsyncData<VerifiedUsersData> {
  const { selectedTenantID } = useTenantSelection();

  const [state, setState] = useState<AsyncData<VerifiedUsersData>>({
    loading: true,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (!selectedTenantID) {
      setState({ loading: false, error: null, data: null });
      return;
    }

    setState({ loading: true, error: null, data: null });

    fetch(
      `/api/keycloak-verified-users?tenantId=${encodeURIComponent(String(selectedTenantID))}`,
    )
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(body.error ?? 'Failed to fetch verified users');
        }

        return (await response.json()) as VerifiedUsersData;
      })
      .then((data) => {
        if (!cancelled) {
          setState({ loading: false, error: null, data });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : String(err),
            data: null,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTenantID]);

  return state;
}

export default function VerifiedUsersWidget() {
  return (
    <SingleStatCardWidget
      label="Verified User Accounts"
      dataSource="custom"
      useData={useVerifiedUsersData}
      selector={(data) => ({
        current: (data as VerifiedUsersData).verifiedUsers,
        previous: 0,
      })}
    />
  );
}
