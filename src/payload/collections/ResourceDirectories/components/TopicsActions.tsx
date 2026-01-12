'use client';

import React, { useState } from 'react';
import { useDocumentInfo, toast, Button, useModal } from '@payloadcms/ui';
import { TranslateTopicsModal } from './TranslateTopicsModal';
import { getTenantLocales } from '../actions/getTenantLocales';

const TopicsActions: React.FC = () => {
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isLoadingTranslate, setIsLoadingTranslate] = useState(false);
  const { id } = useDocumentInfo();
  const { openModal } = useModal();

  const handleTranslateClick = async () => {
    if (!id || typeof id !== 'string') {
      toast.error('Resource directory ID is required');
      return;
    }

    setIsLoadingTranslate(true);

    try {
      const allLocales = await getTenantLocales(id);
      const locales = allLocales.filter((locale) => locale !== 'en');

      if (locales.length === 0) {
        toast.error('No target locales available for translation');
        return;
      }

      setTargetLocales(locales);
      openModal('translate-topics-modal');
    } catch (error) {
      console.error('Error opening translate modal:', error);
      toast.error('Failed to load translation options');
    } finally {
      setIsLoadingTranslate(false);
    }
  };

  return (
    <>
      <Button
        buttonStyle="primary"
        onClick={handleTranslateClick}
        disabled={isLoadingTranslate}
      >
        {isLoadingTranslate ? 'Loading...' : 'Auto-Translate Topics'}
      </Button>
      {typeof id === 'string' && (
        <TranslateTopicsModal
          resourceDirectoryId={id}
          availableLocales={targetLocales}
        />
      )}
    </>
  );
};

export default TopicsActions;
