'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { AsyncData } from '../useAnalyticsData';
import { SingleStatCardWidget } from './SingleStatCardWidget';
import { WIDGET_INFO, WidgetSlug } from '../widgetInfo';

type VerifiedUsersData = {
  verifiedUsers: number;
};

function useVerifiedUsersData(): AsyncData<VerifiedUsersData> {
  const { selectedTenantID } = useTenantSelection();

  const [state, setState] = useState<
    Omit<AsyncData<VerifiedUsersData>, 'refetch'>
  >({
    loading: true,
    error: null,
    data: null,
  });

  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;

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
        if (requestIdRef.current === requestId) {
          setState({ loading: false, error: null, data });
        }
      })
      .catch((err) => {
        if (requestIdRef.current === requestId) {
          setState({
            loading: false,
            error: err instanceof Error ? err.message : String(err),
            data: null,
          });
        }
      });
  }, [selectedTenantID]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

export default function VerifiedUsersWidget() {
  return (
    <SingleStatCardWidget
      description={WIDGET_INFO[WidgetSlug.VerifiedUsers]}
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
