'use client';

import React, { useState } from 'react';
import { useDocumentInfo, toast, Button, useField } from '@payloadcms/ui';
import { TranslateTopicsModal } from './TranslateTopicsModal';
import { getTenantLocales } from '../actions/getTenantLocales';
import { getTrustedDomain } from '../../Tenants/actions/getTrustedDomain';

const ActionButtons: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isLoadingDomain, setIsLoadingDomain] = useState(false);
  const { id } = useDocumentInfo();
  const tenantId = useField({ path: 'tenant' }).value;

  const handleTranslateClick = async () => {
    if (!id || typeof id !== 'string') {
      toast.error('Resource directory ID is required');
      return;
    }

    try {
      const allLocales = await getTenantLocales(id);
      const locales = allLocales.filter((locale) => locale !== 'en');

      if (locales.length === 0) {
        toast.error('No target locales available for translation');
        return;
      }

      setTargetLocales(locales);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error opening translate modal:', error);
      toast.error('Failed to load translation options');
    }
  };

  const handleViewWebpage = async () => {
    if (!tenantId || typeof tenantId !== 'string') {
      toast.error('Tenant ID is required');
      return;
    }

    setIsLoadingDomain(true);
    try {
      const domain = await getTrustedDomain(tenantId);
      if (domain) {
        window.open(`https://${domain}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('No trusted domain configured for this tenant');
      }
    } catch (error) {
      console.error('Error fetching trusted domain:', error);
      toast.error('Failed to load webpage URL');
    } finally {
      setIsLoadingDomain(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}
    >
      <Button buttonStyle="primary" onClick={handleTranslateClick}>
        Auto-Translate Topics
      </Button>

      <Button
        buttonStyle="primary"
        onClick={handleViewWebpage}
        disabled={isLoadingDomain}
      >
        {isLoadingDomain ? 'Loading...' : 'See Live Webpage'}
      </Button>
      {isModalOpen && typeof id === 'string' && (
        <TranslateTopicsModal
          resourceDirectoryId={id}
          availableLocales={targetLocales}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ActionButtons;
