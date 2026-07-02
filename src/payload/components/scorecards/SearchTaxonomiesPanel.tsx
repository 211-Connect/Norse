import { TaxonomySearchItem } from '@/types/taxonomyScorecard';
import './styles.css';
import { useState } from 'react';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';

import { SearchInput } from './SearchInput';
import { SearchNotice } from './SearchNotice';
import { TaxonomyResultsTable } from './TaxonomyResultsTable';
import { useTaxonomySearch } from './useTaxonomySearch';

type SearchTaxonomiesPanelProps = {
  openTaxonomy: (item: TaxonomySearchItem) => Promise<void>;
};

export function SearchTaxonomiesPanel({
  openTaxonomy,
}: SearchTaxonomiesPanelProps) {
  const { selectedTenantID } = useTenantSelection();
  const tenantId =
    selectedTenantID === null || selectedTenantID === undefined
      ? null
      : String(selectedTenantID);
  const [query, setQuery] = useState('');

  const { items, loading, error } = useTaxonomySearch(tenantId, query);

  const onOpenTaxonomy = (item: TaxonomySearchItem) => {
    void openTaxonomy(item);
  };

  return (
    <section
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        padding: '12px',
        display: 'grid',
        gap: '0.75rem',
      }}
    >
      <SearchNotice />
      <SearchInput query={query} onChange={setQuery} />

      {loading && <p style={{ margin: 0 }}>Searching…</p>}
      {error && (
        <p style={{ margin: 0, color: 'var(--theme-error-500)' }}>
          {error.message}
        </p>
      )}

      {!loading && items.length > 0 && (
        <TaxonomyResultsTable items={items} onOpenTaxonomy={onOpenTaxonomy} />
      )}
    </section>
  );
}
