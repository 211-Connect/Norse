import { Button } from '@payloadcms/ui';

import { TaxonomySearchItem } from '@/types/taxonomyScorecard';

type TaxonomyResultsTableProps = {
  items: TaxonomySearchItem[];
  onOpenTaxonomy: (item: TaxonomySearchItem) => void;
};

export function TaxonomyResultsTable({
  items,
  onOpenTaxonomy,
}: TaxonomyResultsTableProps) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{ width: '100%', tableLayout: 'fixed' }}
        className="scorecards-search-table"
      >
        <thead>
          <tr>
            <th align="left" style={{ width: '20%' }}>
              HSIS Code
            </th>
            <th align="left" style={{ width: '60%' }}>
              HSIS Name
            </th>
            <th align="left" style={{ width: '20%' }}>
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.code}
              style={{ height: '18px' }}
              className="scorecards-search-row"
              role="button"
              tabIndex={0}
              onClick={() => onOpenTaxonomy(item)}
            >
              <td style={{ padding: '4px 8px' }}>{item.code}</td>
              <td style={{ padding: '4px 8px' }}>{item.name}</td>
              <td style={{ padding: '4px 8px' }}>
                <Button
                  buttonStyle="secondary"
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenTaxonomy(item);
                  }}
                  margin={false}
                >
                  Open
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
