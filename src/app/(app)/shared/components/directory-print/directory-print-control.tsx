'use client';

import { Printer } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';

import { type PrintVariant } from './pdf-print-primitives';
import {
  PrintDirectoryDialog,
  type PdfDocumentElement,
  type PrintDocumentRenderContext,
} from './print-directory-dialog';

type DirectoryPrintControlProps<TData> = {
  variant?: 'icon' | 'icon-text';
  loadData: (locale: string) => Promise<TData>;
  testId?: string;
  initialVariant?: PrintVariant;
  availableLocales?: string[];
  initialLocale?: string;
  renderDocument: (
    data: TData,
    context: PrintDocumentRenderContext,
  ) => PdfDocumentElement;
  postProcessBlob?: (blob: Blob, data: TData) => Promise<Blob>;
};

export function DirectoryPrintControl<TData>({
  loadData,
  variant = 'icon-text',
  testId = 'print-directory-btn',
  initialVariant,
  availableLocales,
  initialLocale,
  renderDocument,
  postProcessBlob,
}: DirectoryPrintControlProps<TData>) {
  const { t } = useTranslation(['common', 'page-list']);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        size={variant === 'icon-text' ? 'default' : 'icon'}
        variant="outline"
        onClick={() => setOpen(true)}
        data-testid={testId}
        ref={triggerRef}
        aria-label={t('call_to_action.print')}
        className="gap-2"
      >
        <Printer className="size-4" />
        {variant === 'icon-text' && <span>{t('call_to_action.print')}</span>}
      </Button>

      <PrintDirectoryDialog
        open={open}
        onOpenChange={setOpen}
        loadData={loadData}
        onRestoreFocus={() => triggerRef.current?.focus()}
        initialVariant={initialVariant}
        availableLocales={availableLocales}
        initialLocale={initialLocale}
        renderDocument={renderDocument}
        postProcessBlob={postProcessBlob}
      />
    </>
  );
}
