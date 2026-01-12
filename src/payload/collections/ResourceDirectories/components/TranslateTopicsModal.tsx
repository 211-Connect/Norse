'use client';

import React, { useState } from 'react';
import { Button, toast, Modal, useModal } from '@payloadcms/ui';
import { TaskTranslateTopics } from '@/payload/payload-types';

interface TranslateTopicsModalProps {
  resourceDirectoryId: string;
  availableLocales: string[];
}

export const TranslateTopicsModal: React.FC<TranslateTopicsModalProps> = ({
  resourceDirectoryId,
  availableLocales,
}) => {
  const { closeModal } = useModal();
  const [engine, setEngine] = useState<'azure' | 'google'>('azure');
  const [selectedLocales, setSelectedLocales] = useState<Set<string>>(
    new Set(),
  );
  const [force, setForce] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLocaleToggle = (locale: string) => {
    const newSelected = new Set(selectedLocales);
    if (newSelected.has(locale)) {
      newSelected.delete(locale);
    } else {
      newSelected.add(locale);
    }
    setSelectedLocales(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLocales.size === availableLocales.length) {
      setSelectedLocales(new Set());
    } else {
      setSelectedLocales(new Set(availableLocales));
    }
  };

  const handleSubmit = async () => {
    if (selectedLocales.size === 0) {
      toast.error('Please select at least one locale');
      return;
    }

    setIsSubmitting(true);

    const body: TaskTranslateTopics['input'] = {
      tenantId: resourceDirectoryId,
      locales: Array.from(selectedLocales).map((locale) => ({ locale })),
      engine,
      force,
    };

    try {
      const response = await fetch('/api/translate-topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be logged in to start translations');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to start translations');
        }
        const error = await response.json();
        throw new Error(error.message || 'Translation failed');
      }

      const result = await response.json();

      toast.success(
        `Translation job started! Job ID: ${result.jobId}. Check the Translation Jobs page for progress.`,
      );

      closeModal('translate-topics-modal');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start translation job',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal slug="translate-topics-modal">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <div
          style={{
            background: 'var(--theme-elevation-0)',
            borderRadius: '8px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 0 16px rgba(0, 0, 0, 0.25)',
          }}
        >
          <h2 style={{ marginTop: '0', marginBottom: '24px' }}>
            Auto-Translate Topics
          </h2>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              Translation Engine
            </label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as 'azure' | 'google')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <option value="azure">Azure Translator</option>
              <option value="google">Google Translate</option>
            </select>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <label style={{ fontWeight: 'bold' }}>Locales</label>
              <Button
                buttonStyle="secondary"
                size="small"
                onClick={handleSelectAll}
              >
                {selectedLocales.size === availableLocales.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Button>
            </div>
            <div
              style={{
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '12px',
                maxHeight: '200px',
                overflowY: 'auto',
                gap: '8px',
              }}
            >
              {availableLocales.map((locale) => (
                <div
                  key={locale}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="checkbox"
                    id={`locale-${locale}`}
                    checked={selectedLocales.has(locale)}
                    onChange={() => handleLocaleToggle(locale)}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor={`locale-${locale}`}>{locale}</label>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}
          >
            <input
              type="checkbox"
              id="force-translate"
              checked={force}
              onChange={(e) => setForce(e.target.checked)}
              style={{ marginRight: '16px' }}
            />
            <label htmlFor="force-translate">
              <strong>Force re-translate all fields</strong>
              <br />
              <span style={{ fontSize: '0.75em', color: '#666' }}>
                If unchecked, only empty fields will be translated
              </span>
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <Button
              buttonStyle="secondary"
              onClick={() => closeModal('translate-topics-modal')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Starting...' : 'Start Translation'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
