'use client';

import { Button, useAuth } from '@payloadcms/ui';
import { useState } from 'react';

import './styles.css';

const ClearCacheButton = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!user || !user.roles.includes('super-admin')) {
    return null;
  }

  async function onClick() {
    setLoading(true);
    await fetch('/api/clear-cache?secret=7cbde38e-32d8-42e6-8000-9dcf4d57502b');
    setLoading(false);
  }

  if (loading) {
    return (
      <Button size="large" disabled>
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
