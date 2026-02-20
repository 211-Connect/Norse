'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import { findTenantById } from '@/payload/collections/Tenants/actions/findTenantById';

const TenantHeader = () => {
  const { id } = useDocumentInfo();
  const [tenantName, setTenantName] = useState<string>('');

  useEffect(() => {
    if (!id) return;

    findTenantById(String(id))
      .then((tenant) => {
        if (tenant?.name) {
          setTenantName(tenant.name);
        } else {
          setTenantName(String(id));
        }
      })
      .catch(() => {
        setTenantName(String(id));
      });
  }, [id]);

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
    </div>
  );
};

export default TenantHeader;
