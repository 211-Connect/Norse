'use client';

import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/app/(app)/shared/lib/getErrorMessage';
import { ScorecardTaxonomyItemDto } from '@/lib/api/generated/data-contracts';
import { fetchStatus } from './api';
import { ScorecardEditorModal } from './ScorecardEditorModal';
import { SearchTaxonomiesPanel } from './SearchTaxonomiesPanel';
import { ManagerError, ScorecardsStatusResponse } from './types';

export default function ScorecardsManager() {
  const { selectedTenantID } = useTenantSelection();
  const tenantId = String(selectedTenantID);

  const [statusState, setStatusState] = useState<{
    data: ScorecardsStatusResponse | null;
    loading: boolean;
    error: ManagerError | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const [selectedTaxonomy, setSelectedTaxonomy] =
    useState<ScorecardTaxonomyItemDto | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      if (!tenantId) {
        setStatusState({ data: null, error: null, loading: false });
        setSelectedTaxonomy(null);
        return;
      }

      const resolvedTenantId = tenantId;

      setStatusState((current) => ({ ...current, loading: true, error: null }));

      try {
        const result = await fetchStatus(resolvedTenantId);

        if (!cancelled) {
          setStatusState({ data: result, loading: false, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setStatusState({
            data: null,
            loading: false,
            error: { message: getErrorMessage(error) },
          });
        }
      }
    };

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  const openTaxonomy = async (item: ScorecardTaxonomyItemDto) => {
    setSelectedTaxonomy(item);
  };

  const closeEditor = () => {
    setSelectedTaxonomy(null);
  };

  if (!tenantId) {
    return <p>Select a tenant to manage taxonomy scorecards.</p>;
  }

  if (statusState.loading) {
    return <p>Loading scorecard availability…</p>;
  }

  if (statusState.error) {
    return (
      <p style={{ color: 'var(--theme-error-500)' }}>
        {statusState.error.message}
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {!statusState.data?.aiClassificationEnabled && (
        <div
          style={{
            border: '1px solid var(--theme-warning-400)',
            background: 'var(--theme-warning-100)',
            borderRadius: '8px',
            padding: '12px',
          }}
        >
          This tenant&apos;s public directory is not using AI classification.
          These scorecard weights still apply when the AI-classification engine
          is requested directly, for example by API consumers.
        </div>
      )}

      <SearchTaxonomiesPanel openTaxonomy={openTaxonomy} />

      {selectedTaxonomy && (
        <ScorecardEditorModal
          selectedTaxonomy={selectedTaxonomy}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
