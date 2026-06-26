import { NEED_DEFINITIONS } from './constants';

type ScorecardWeightsTableProps = {
  weightInputs: Record<string, string>;
  validationErrors: Record<string, string>;
  onWeightChange: (needCode: string, value: string) => void;
};

export function ScorecardWeightsTable({
  weightInputs,
  validationErrors,
  onWeightChange,
}: ScorecardWeightsTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          tableLayout: 'fixed',
          fontSize: '0.92rem',
        }}
      >
        <thead>
          <tr>
            <th align="left" style={{ width: 120 }}>
              UWWW Code
            </th>
            <th align="left" style={{ width: 280 }}>
              Name
            </th>
            <th align="left" style={{ maxWidth: 800 }}>
              Description
            </th>
            <th align="left" style={{ width: 90 }}>
              Weight (0–1)
            </th>
          </tr>
        </thead>
        <tbody>
          {NEED_DEFINITIONS.map((need) => (
            <tr key={need.code}>
              <td style={{ padding: '4px 6px' }}>{need.code}</td>
              <td style={{ padding: '4px 6px' }}>{need.name}</td>
              <td style={{ padding: '4px 6px' }}>{need.description || '—'}</td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step="0.01"
                  value={weightInputs[need.code] ?? ''}
                  onChange={(event) =>
                    onWeightChange(need.code, event.target.value)
                  }
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    border: validationErrors[need.code]
                      ? '1px solid var(--theme-error-500)'
                      : '1px solid var(--theme-elevation-250)',
                  }}
                />
                {validationErrors[need.code] && (
                  <small style={{ color: 'var(--theme-error-500)' }}>
                    {validationErrors[need.code]}
                  </small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
