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

import { HeaderFooterDialogValues } from '../../utils/dialog-types';
import { LayoutEditor } from './layout-editor';
import { LocalizedFieldTable } from './localized-field-table';

type HeaderFooterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  title: string;
  initialValues: HeaderFooterDialogValues;
  onSubmit: (values: HeaderFooterDialogValues) => Promise<void>;
};

export function HeaderFooterDialog({
  open,
  onOpenChange,
  isSubmitting,
  title,
  initialValues,
  onSubmit,
}: HeaderFooterDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<HeaderFooterDialogValues['layout']>([]);

  const reset = () => {
    setTextValues(initialValues?.textLocalized?.values ?? {});
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
      textLocalized: { values: textValues },
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
          <LayoutEditor value={layout} onChange={setLayout} />

          <LocalizedFieldTable
            label={t('text_label', { ns: 'page-directories' })}
            values={textValues}
            multiline
            onChange={(locale, next) =>
              setTextValues((previous) => ({
                ...previous,
                [locale]: next,
              }))
            }
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
