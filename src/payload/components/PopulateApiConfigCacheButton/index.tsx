'use client';

import { Button, useAuth } from '@payloadcms/ui';
import { useState } from 'react';

import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

import './styles.css';

const PopulateApiConfigCacheButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user || !user.roles.includes('super-admin')) {
    return null;
  }

  async function onClick() {
    setLoading(true);
    try {
      await fetchWrapper(
        withOptionalCustomBasePath('/api/populate-api-config-cache'),
        {
          parseResponse: false,
          credentials: 'include',
        },
      );
    } catch (error) {
      console.error('Failed to populate API config cache:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Button
        className="populate-api-config-cache-button"
        size="large"
        disabled
      >
        Populating config cache...
      </Button>
    );
  }

  return (
    <Button
      className="populate-api-config-cache-button"
      size="large"
      onClick={onClick}
    >
      Create config cache
    </Button>
  );
};

export default PopulateApiConfigCacheButton;
