import { Button } from '@payloadcms/ui';

import { TaxonomyScorecardVersion } from '@/types/taxonomyScorecard';

type ScorecardVersionHistoryProps = {
  versions: TaxonomyScorecardVersion[];
  activeVersionId: string | null | undefined;
  enablingVersionId: string | null;
  onPreviewVersion: (version: TaxonomyScorecardVersion) => void;
  onEnable: (versionId: string) => void;
  formatDateTime: (value: string | null | undefined) => string;
  formatVersionLabel: (value: string | null | undefined) => string;
};

export function ScorecardVersionHistory({
  versions,
  activeVersionId,
  enablingVersionId,
  onPreviewVersion,
  onEnable,
  formatDateTime,
  formatVersionLabel,
}: ScorecardVersionHistoryProps) {
  const normalizedActiveVersionId = String(activeVersionId ?? '').trim();

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <h3 style={{ margin: 0 }}>Version History</h3>
      {versions.length === 0 ? (
        <p style={{ margin: 0 }}>No historical versions.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th align="left" style={{ width: '22%' }}>
                  Version ID
                </th>
                <th align="left" style={{ width: '20%' }}>
                  Created
                </th>
                <th align="left" style={{ width: '18%' }}>
                  Top Category
                </th>
                <th align="left" style={{ width: '15%' }}>
                  Weights
                </th>
                <th align="left" style={{ width: '25%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {versions.map((version) => {
                const versionWeights = version.scorecard?.need?.weights ?? {};
                const isActive =
                  String(version.version_id).trim() ===
                  normalizedActiveVersionId;

                return (
                  <tr key={version.version_id}>
                    <td>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <span>{formatVersionLabel(version.version_id)}</span>
                        {isActive && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              border: '1px solid var(--theme-success-400)',
                              color: 'var(--theme-success-600)',
                              background: 'var(--theme-success-100)',
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{formatDateTime(version.created_at)}</td>
                    <td>{version.scorecard?.need?.top_category_code ?? '—'}</td>
                    <td>{Object.keys(versionWeights).length}</td>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Button
                          buttonStyle="secondary"
                          size="small"
                          onClick={() => onPreviewVersion(version)}
                          margin={false}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          onClick={() => onEnable(version.version_id)}
                          disabled={
                            enablingVersionId === version.version_id || isActive
                          }
                          margin={false}
                        >
                          {enablingVersionId === version.version_id
                            ? 'Enabling…'
                            : isActive
                              ? 'Enabled'
                              : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
