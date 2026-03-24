'use client';

import { Button, useAuth } from '@payloadcms/ui';
import { useState } from 'react';
import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';

import './styles.css';

const ClearCacheButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user || !user.roles.includes('super-admin')) {
    return null;
  }

  async function onClick() {
    setLoading(true);
    try {
      await fetchWrapper('/api/clear-cache', {
        parseResponse: false,
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Button className="clear-cache-button" size="large" disabled>
        Clearing cache...
      </Button>
    );
  }

  return (
    <Button className="clear-cache-button" size="large" onClick={onClick}>
      Clear cache
    </Button>
  );
};

export default ClearCacheButton;
