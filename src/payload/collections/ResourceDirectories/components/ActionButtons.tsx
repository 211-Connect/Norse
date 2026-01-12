'use client';

import React, { useState } from 'react';
import {
  useDocumentInfo,
  toast,
  Button,
  useField,
  useModal,
} from '@payloadcms/ui';
import { TranslateTopicsModal } from './TranslateTopicsModal';
import { getTenantLocales } from '../actions/getTenantLocales';
import { getTrustedDomain } from '../../Tenants/actions/getTrustedDomain';
import { LoaderCircle } from 'lucide-react';

import './ActionButtons.css';

const ActionButtons: React.FC = () => {
  const [targetLocales, setTargetLocales] = useState<string[]>([]);
  const [isLoadingTranslate, setIsLoadingTranslate] = useState(false);
  const [isLoadingWebpage, setIsLoadingWebpage] = useState(false);
  const { id } = useDocumentInfo();
  const tenantId = useField({ path: 'tenant' }).value;
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

  const handleViewWebpage = async () => {
    if (!tenantId || typeof tenantId !== 'string') {
      toast.error('Tenant ID is required');
      return;
    }

    setIsLoadingWebpage(true);
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
      setIsLoadingWebpage(false);
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
      <Button
        buttonStyle="primary"
        onClick={handleTranslateClick}
        disabled={isLoadingTranslate}
        className="action-button"
      >
        {isLoadingTranslate ? (
          <LoaderCircle
            size={16}
            color="white"
            strokeWidth={2}
            className="spinner-icon"
          />
        ) : (
          <span>Auto-Translate Topics</span>
        )}
      </Button>

      <Button
        buttonStyle="primary"
        onClick={handleViewWebpage}
        disabled={isLoadingWebpage}
        className="action-button"
      >
        {isLoadingWebpage ? (
          <LoaderCircle
            size={16}
            color="white"
            strokeWidth={2}
            className="spinner-icon"
          />
        ) : (
          <span>See Live Webpage</span>
        )}
      </Button>
      {typeof id === 'string' && (
        <TranslateTopicsModal
          resourceDirectoryId={id}
          availableLocales={targetLocales}
        />
      )}
    </div>
  );
};

export default ActionButtons;
