'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import { findResourceDirectoryByTenantId } from '@/payload/collections/ResourceDirectories/actions/findResourceDirectoryByTenantId';
import { findTenantById } from '@/payload/collections/Tenants/actions/findTenantById';

const HYBRID_SEARCH_ENGINES = ['hybrid', 'ai_classification'];

const HybridSearchConfigHeader = () => {
  const { id } = useDocumentInfo();
  const [tenantName, setTenantName] = useState<string>('');
  const [searchEngine, setSearchEngine] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!id) return;

    findTenantById(String(id), false)
      .then((tenant) => {
        setTenantName(tenant?.name || String(id));
      })
      .catch(() => {
        setTenantName(String(id));
      });

    findResourceDirectoryByTenantId(String(id))
      .then((resourceDirectory) => {
        setSearchEngine(
          resourceDirectory?.search?.searchSettings?.searchEngine ?? null,
        );
      })
      .catch(() => {
        setSearchEngine(null);
      });
  }, [id]);

  const showEngineWarning =
    searchEngine !== undefined &&
    !HYBRID_SEARCH_ENGINES.includes(searchEngine || '');

  return (
    <div
      style={{
        padding: '16px 24px',
        backgroundColor: 'var(--theme-elevation-100)',
        borderBottom: '1px solid var(--theme-elevation-300)',
        marginBottom: '20px',
        minHeight: '76px',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: 'var(--theme-elevation-600)',
          marginBottom: '4px',
        }}
      >
        Tenant
      </div>
      <div
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--theme-elevation-1000)',
        }}
      >
        {tenantName || '\u00A0'}
      </div>
      {showEngineWarning && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '4px',
            backgroundColor: 'var(--theme-warning-100)',
            border: '1px solid var(--theme-warning-300)',
            color: 'var(--theme-warning-900)',
            fontSize: '13px',
          }}
        >
          These settings only take effect when this tenant&apos;s Search Engine
          (Settings → Search) is set to Hybrid or AI Classification. It is
          currently set to Classic, so these values are ignored.
        </div>
      )}
    </div>
  );
};

export default HybridSearchConfigHeader;
