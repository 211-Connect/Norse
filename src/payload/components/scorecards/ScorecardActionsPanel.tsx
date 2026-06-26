import { Button } from '@payloadcms/ui';

import { UpdateTaxonomyScorecardResponse } from '@/types/taxonomyScorecard';

type ScorecardActionsPanelProps = {
  taxonomyCode: string;
  applyToChildren: boolean;
  onApplyToChildrenChange: (value: boolean) => void;
  includeSiblings: boolean;
  onIncludeSiblingsChange: (value: boolean) => void;
  saveLoading: boolean;
  scorecardLoading: boolean;
  onSave: () => void;
  onSaveDraft: () => void;
  saveResult: UpdateTaxonomyScorecardResponse | null;
};

export function ScorecardActionsPanel({
  taxonomyCode,
  applyToChildren,
  onApplyToChildrenChange,
  includeSiblings,
  onIncludeSiblingsChange,
  saveLoading,
  scorecardLoading,
  onSave,
  onSaveDraft,
  saveResult,
}: ScorecardActionsPanelProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '10px',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        padding: '10px 12px',
        background: 'var(--theme-elevation-50)',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            checked={applyToChildren}
            onChange={(event) => onApplyToChildrenChange(event.target.checked)}
          />
          Apply to child taxonomies
        </label>

        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            checked={includeSiblings}
            onChange={(event) => onIncludeSiblingsChange(event.target.checked)}
          />
          Apply to sibling taxonomies
        </label>
      </div>

      <small style={{ color: 'var(--theme-elevation-700)' }}>
        Example for <strong>{taxonomyCode}</strong>: children includes
        descendant codes that start with <strong>{taxonomyCode}</strong> (for
        example <strong>{taxonomyCode}.0100</strong>). Siblings includes
        taxonomies in the same parent group.
      </small>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <Button
          onClick={onSave}
          disabled={saveLoading || scorecardLoading}
          margin={false}
        >
          {saveLoading ? 'Saving…' : 'Save and enable'}
        </Button>
        <Button
          buttonStyle="secondary"
          margin={false}
          onClick={onSaveDraft}
          disabled={saveLoading || scorecardLoading}
        >
          {saveLoading ? 'Saving draft…' : 'Save draft'}
        </Button>
      </div>

      {saveResult?.potentially_affected_codes?.length ? (
        <div>
          <strong>Taxonomies affected when enabled:</strong>{' '}
          {saveResult.potentially_affected_codes.join(', ')}
        </div>
      ) : null}

      {saveResult?.affected_codes?.length ? (
        <div>
          <strong>Affected taxonomies:</strong>{' '}
          {saveResult.affected_codes.join(', ')}
        </div>
      ) : null}
    </div>
  );
}
