import { Button } from '@payloadcms/ui';

import { TaxonomySearchItem } from '@/types/taxonomyScorecard';

type ScorecardEditorHeaderProps = {
  selectedTaxonomy: TaxonomySearchItem;
  onClose: () => void;
};

export function ScorecardEditorHeader({
  selectedTaxonomy,
  onClose,
}: ScorecardEditorHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h2 style={{ margin: 0 }}>Scorecard Editor</h2>
        <p style={{ margin: 0 }}>
          <strong>HSIS:</strong> {selectedTaxonomy.code} —{' '}
          {selectedTaxonomy.name}
        </p>
      </div>
      <Button buttonStyle="secondary" size="small" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
