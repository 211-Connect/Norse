'use client';

import React, { useState } from 'react';
import { toast, Button, useDocumentInfo, useAuth } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';

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
      const response = await fetch('/api/duplicate-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate tenant');
      }

      toast.success(`Tenant duplicated successfully: ${data.tenant.name}`);

      router.push(`/admin/collections/tenants/${data.tenant.id}`);
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
