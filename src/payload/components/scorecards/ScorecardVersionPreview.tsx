import { Button } from '@payloadcms/ui';

import { TaxonomyScorecardVersion } from '@/types/taxonomyScorecard';
import { NEED_DEFINITIONS } from './constants';

type ScorecardVersionPreviewProps = {
  previewVersion: TaxonomyScorecardVersion;
  onClosePreview: () => void;
};

export function ScorecardVersionPreview({
  previewVersion,
  onClosePreview,
}: ScorecardVersionPreviewProps) {
  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-200)',
        borderRadius: '8px',
        padding: '12px',
        display: 'grid',
        gap: '0.5rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0 }}>
          Preview Version {previewVersion.version_id}
        </h3>
        <Button
          buttonStyle="secondary"
          size="small"
          onClick={onClosePreview}
          margin={false}
        >
          Close Preview
        </Button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th align="left" style={{ width: '30%' }}>
                UWWW Need Code
              </th>
              <th align="left" style={{ width: '40%' }}>
                Need Name
              </th>
              <th align="left" style={{ width: '30%' }}>
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {NEED_DEFINITIONS.map((need) => (
              <tr key={need.code}>
                <td>{need.code}</td>
                <td>{need.name}</td>
                <td>
                  {previewVersion.scorecard?.need?.weights?.[need.code] ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
