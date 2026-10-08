'use client';

import { Button, useAuth } from '@payloadcms/ui';
import { useState } from 'react';

import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import { withOptionalCustomBasePath } from '@/app/(app)/shared/lib/utils';

import './styles.css';

const SyncKeycloakBrandingButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user || !user.roles.includes('super-admin')) {
    return null;
  }

  async function onClick() {
    setLoading(true);
    try {
      await fetchWrapper(
        withOptionalCustomBasePath('/api/sync-keycloak-branding'),
        {
          parseResponse: false,
          credentials: 'include',
        },
      );
    } catch (error) {
      console.error('Failed to sync Keycloak branding:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Button className="sync-keycloak-branding-button" size="large" disabled>
        Syncing branding...
      </Button>
    );
  }

  return (
    <Button
      className="sync-keycloak-branding-button"
      size="large"
      onClick={onClick}
    >
      Sync Keycloak branding
    </Button>
  );
};

export default SyncKeycloakBrandingButton;
