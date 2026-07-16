'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { ColorPicker } from '@/app/(app)/shared/components/ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';

import { CoverDialogValues } from '../../utils/dialog-types';
import { LocalizedFieldTable } from './localized-field-table';

type CoverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  initialValues: CoverDialogValues;
  onSubmit: (values: CoverDialogValues) => Promise<void>;
};

export function CoverDialog({
  open,
  onOpenChange,
  isSubmitting,
  initialValues,
  onSubmit,
}: CoverDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [titleValues, setTitleValues] = useState<Record<string, string>>({});
  const [descriptionValues, setDescriptionValues] = useState<
    Record<string, string>
  >({});
  const [primaryColor, setPrimaryColor] = useState('');

  const reset = () => {
    setTitleValues(initialValues.titleLocalized.values ?? {});
    setDescriptionValues(initialValues.descriptionLocalized.values ?? {});
    setPrimaryColor(initialValues.primaryColor);
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
      titleLocalized: { values: titleValues },
      descriptionLocalized: { values: descriptionValues },
      primaryColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('edit_cover', { ns: 'page-directories' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <LocalizedFieldTable
            label={t('title_label', { ns: 'page-directories' })}
            values={titleValues}
            onChange={(locale, next) =>
              setTitleValues((previous) => ({
                ...previous,
                [locale]: next,
              }))
            }
          />

          <LocalizedFieldTable
            label={t('description_label', { ns: 'page-directories' })}
            values={descriptionValues}
            multiline
            onChange={(locale, next) =>
              setDescriptionValues((previous) => ({
                ...previous,
                [locale]: next,
              }))
            }
          />

          <div className="space-y-2">
            <Label htmlFor="cover-primary-color">
              {t('primary_color_label', { ns: 'page-directories' })}
            </Label>
            <ColorPicker
              id="cover-primary-color"
              value={primaryColor}
              onChange={setPrimaryColor}
              placeholder="#0f172a"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover-layout-type">
              {t('layout_type_label', { ns: 'page-directories' })}
            </Label>
            <Input id="cover-layout-type" value="default" disabled />
          </div>
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
