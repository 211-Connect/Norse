'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';

import { PrintableDirectoryLocalizedValuesDto } from '@/lib/api/generated/data-contracts';

import {
  EMPTY_LOCALIZED_VALUES,
  HeaderFooterDialogValues,
} from '../../utils/dialog-types';
import { LayoutEditor } from './layout-editor';
import { LocalizedFieldTable } from './localized-field-table';

type HeaderFooterDialogProps = {
  kind: 'header' | 'footer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  title: string;
  initialValues: HeaderFooterDialogValues;
  onSubmit: (values: HeaderFooterDialogValues) => Promise<void>;
  primaryLanguage: string;
  locales: string[];
};

export function HeaderFooterDialog({
  kind,
  open,
  onOpenChange,
  isSubmitting,
  title,
  initialValues,
  onSubmit,
  primaryLanguage,
  locales,
}: HeaderFooterDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const textLabel = t(
    kind === 'header' ? 'header_text_label' : 'footer_text_label',
    { ns: 'page-directories' },
  );
  const [text, setText] = useState<PrintableDirectoryLocalizedValuesDto>(
    EMPTY_LOCALIZED_VALUES,
  );
  const [layout, setLayout] = useState<HeaderFooterDialogValues['layout']>([]);

  const reset = () => {
    setText(initialValues.textLocalized ?? EMPTY_LOCALIZED_VALUES);
    setLayout(initialValues.layout);
  };

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      reset();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    await onSubmit({
      textLocalized: text,
      layout,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <LayoutEditor kind={kind} value={layout} onChange={setLayout} />

          <LocalizedFieldTable
            label={textLabel}
            value={text}
            multiline
            primaryLanguage={primaryLanguage}
            locales={locales}
            onChange={setText}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {isSubmitting
              ? t('saving', { ns: 'page-directories' })
              : t('call_to_action.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
