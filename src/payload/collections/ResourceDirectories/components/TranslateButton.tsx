'use client';

import React, { useState } from 'react';
import { toast, Button, useModal } from '@payloadcms/ui';
import { TranslateModal } from './TranslateModal';
import { getTenantLocales } from '../../Tenants/components/actions/getTenantLocales';

interface TranslateButtonProps {
  tenantId: string;
}

export const TranslateButton: React.FC<TranslateButtonProps> = ({
  tenantId,
}) => {
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isLoadingTranslate, setIsLoadingTranslate] = useState(false);
  const { openModal } = useModal();

  const handleTranslateClick = async () => {
    if (!tenantId) {
      toast.error('Tenant ID is required');
      return;
    }

    setIsLoadingTranslate(true);

    try {
      const allLocales = await getTenantLocales(tenantId);
      const locales = allLocales.filter((locale) => locale !== 'en');

      if (locales.length === 0) {
        toast.error('No target locales available for translation');
        return;
      }

      setTargetLocales(locales);
      openModal('translate-modal');
    } catch (error) {
      console.error('Error opening translate modal:', error);
      toast.error('Failed to load translation options');
    } finally {
      setIsLoadingTranslate(false);
    }
  };

  if (!tenantId) {
    return null;
  }

  return (
    <>
      <Button
        buttonStyle="primary"
        onClick={handleTranslateClick}
        disabled={isLoadingTranslate}
      >
        {isLoadingTranslate ? 'Loading...' : 'Translate (BETA)'}
      </Button>
      <TranslateModal
        resourceDirectoryId={tenantId}
        availableLocales={targetLocales}
      />
    </>
  );
};
