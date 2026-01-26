'use client';

import React, { useState } from 'react';
import { toast, Button, useDocumentInfo, useAuth } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';

const TenantActions: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const router = useRouter();

  if (!user || !user.roles.includes('super-admin')) {
    return null;
  }

  const handleDuplicate = async () => {
    if (!id || typeof id !== 'string') {
      toast.error('Tenant ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchWrapper('/api/duplicate-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: { tenantId: id },
      });

      if (data?.tenant) {
        toast.success(`Tenant duplicated successfully: ${data.tenant.name}`);
        router.push(`/admin/collections/tenants/${data.tenant.id}`);
      } else {
        throw new Error('Failed to duplicate tenant');
      }
    } catch (error) {
      console.error('Error duplicating tenant:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to duplicate tenant',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      buttonStyle="secondary"
      onClick={handleDuplicate}
      disabled={isLoading}
    >
      {isLoading ? 'Duplicating...' : 'Duplicate'}
    </Button>
  );
};

export default TenantActions;
