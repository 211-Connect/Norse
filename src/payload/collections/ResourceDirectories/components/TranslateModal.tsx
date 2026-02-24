'use client';

import React, { useState } from 'react';
import { Button, toast, Modal, useModal } from '@payloadcms/ui';
import { TaskTranslate } from '@/payload/payload-types';
import { fetchWrapper } from '@/app/(app)/shared/lib/fetchWrapper';
import { createLogger } from '@/lib/logger';

const log = createLogger('translate-modal');

interface TranslateModalProps {
  resourceDirectoryId: string;
  availableLocales: string[];
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  resourceDirectoryId,
  availableLocales,
}) => {
  const { closeModal } = useModal();
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

    const body: TaskTranslate['input'] = {
      tenantId: resourceDirectoryId,
      locales: Array.from(selectedLocales).map((locale) => ({ locale })),
      engine: 'google',
      force,
    };

    try {
      const result = await fetchWrapper(
        `${process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH || ''}/api/translate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body,
        },
      );

      if (result) {
        toast.success(
          `Translation job #${result.jobId} queued! If translations do not appear shortly, please contact with administrator.`,
        );

        closeModal('translate-modal');
      } else {
        throw new Error('Failed to start translation job');
      }
    } catch (error) {
      log.error({ err: error }, 'Translation error');
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
    <Modal slug="translate-modal">
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
            Auto-Translate
          </h2>

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
              onClick={() => closeModal('translate-modal')}
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
