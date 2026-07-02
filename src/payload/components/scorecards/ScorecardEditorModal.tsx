import { TaxonomySearchItem } from '@/types/taxonomyScorecard';

import { ScorecardActionsPanel } from './ScorecardActionsPanel';
import { ScorecardEditorHeader } from './ScorecardEditorHeader';
import { ScorecardVersionHistory } from './ScorecardVersionHistory';
import { ScorecardVersionPreview } from './ScorecardVersionPreview';
import { ScorecardWeightsTable } from './ScorecardWeightsTable';
import { useScorecardEditor } from './useScorecardEditor';

const formatVersionLabel = (value: string | null | undefined): string => {
  if (!value) {
    return 'Default';
  }

  return String(value).trim() === '0' ? 'Default' : value;
};

const formatDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
};

type ScorecardEditorModalProps = {
  selectedTaxonomy: TaxonomySearchItem;
  onClose: () => void;
};

export function ScorecardEditorModal({
  selectedTaxonomy,
  onClose,
}: ScorecardEditorModalProps) {
  const {
    scorecardState,
    weightInputs,
    validationErrors,
    applyToChildren,
    includeSiblings,
    saveLoading,
    saveResult,
    versions,
    previewVersion,
    enablingVersionId,
    setWeightInputs,
    setApplyToChildren,
    setIncludeSiblings,
    setPreviewVersion,
    handleSave,
    handleEnable,
  } = useScorecardEditor({
    selectedTaxonomy,
  });

  const taxonomyCode = selectedTaxonomy.code;

  return (
    <section
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxHeight: '90vh',
          maxWidth: 1400,
          overflow: 'auto',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '8px',
          padding: '16px',
          display: 'grid',
          gap: '1rem',
          background: 'var(--theme-elevation-0)',
        }}
      >
        <ScorecardEditorHeader
          selectedTaxonomy={selectedTaxonomy}
          onClose={onClose}
        />

        {scorecardState.loading && (
          <p style={{ margin: 0 }}>Loading scorecard…</p>
        )}
        {scorecardState.error && (
          <p style={{ margin: 0, color: 'var(--theme-error-500)' }}>
            {scorecardState.error.message}
          </p>
        )}

        {scorecardState.response && (
          <>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '8px',
                padding: '10px 12px',
                background: 'var(--theme-elevation-50)',
              }}
            >
              <p style={{ margin: 0 }}>
                <strong>Resolved from:</strong>{' '}
                {scorecardState.response.source?.owner === 'default'
                  ? 'default'
                  : 'tenant'}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Active version:</strong>{' '}
                {formatVersionLabel(
                  scorecardState.response.version_metadata?.active_version,
                )}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Updated at:</strong>{' '}
                {formatDateTime(scorecardState.response.updated_at)}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Last action:</strong>{' '}
                {scorecardState.response.version_metadata?.last_action ?? '—'}
              </p>
            </div>

            {scorecardState.response.source?.owner === 'default' && (
              <div
                style={{
                  border: '1px solid var(--theme-warning-400)',
                  background: 'var(--theme-warning-100)',
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                This tenant does not have a custom scorecard for this taxonomy
                yet. Saving will create a tenant-specific override.
              </div>
            )}

            <ScorecardWeightsTable
              weightInputs={weightInputs}
              validationErrors={validationErrors}
              onWeightChange={(needCode, value) =>
                setWeightInputs((current) => ({
                  ...current,
                  [needCode]: value,
                }))
              }
            />

            <ScorecardActionsPanel
              taxonomyCode={taxonomyCode}
              applyToChildren={applyToChildren}
              onApplyToChildrenChange={setApplyToChildren}
              includeSiblings={includeSiblings}
              onIncludeSiblingsChange={setIncludeSiblings}
              saveLoading={saveLoading}
              scorecardLoading={scorecardState.loading}
              onSave={() => void handleSave(false)}
              onSaveDraft={() => void handleSave(true)}
              saveResult={saveResult}
            />

            <ScorecardVersionHistory
              versions={versions}
              activeVersionId={
                scorecardState.response.version_metadata?.active_version
              }
              enablingVersionId={enablingVersionId}
              onPreviewVersion={setPreviewVersion}
              onEnable={(versionId) => void handleEnable(versionId)}
              formatDateTime={formatDateTime}
              formatVersionLabel={formatVersionLabel}
            />

            {previewVersion && (
              <ScorecardVersionPreview
                previewVersion={previewVersion}
                onClosePreview={() => setPreviewVersion(null)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}
