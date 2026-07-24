'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { ColorPicker } from '@/app/(app)/shared/components/ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';

import { CoverDialogValues } from '../../utils/dialog-types';
import { CoverImageField } from './cover-image-field';
import { LocalizedFieldTable } from './localized-field-table';

type CoverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  initialValues: CoverDialogValues;
  onSubmit: (values: CoverDialogValues) => Promise<void>;
  directoryId: string;
};

export function CoverDialog({
  open,
  onOpenChange,
  isSubmitting,
  initialValues,
  onSubmit,
  directoryId,
}: CoverDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [titleValues, setTitleValues] = useState<Record<string, string>>({});
  const [descriptionValues, setDescriptionValues] = useState<
    Record<string, string>
  >({});
  const [primaryColor, setPrimaryColor] = useState('');
  const [coverImageUrlFront, setCoverImageUrlFront] = useState('');
  const [coverImageUrlBack, setCoverImageUrlBack] = useState('');

  const reset = () => {
    setTitleValues(initialValues.titleLocalized.values ?? {});
    setDescriptionValues(initialValues.descriptionLocalized.values ?? {});
    setPrimaryColor(initialValues.primaryColor);
    setCoverImageUrlFront(initialValues.coverImageUrlFront ?? '');
    setCoverImageUrlBack(initialValues.coverImageUrlBack ?? '');
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
      coverImageUrlFront,
      coverImageUrlBack,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('edit_cover', { ns: 'page-directories' })}
          </DialogTitle>
          <DialogDescription>
            {t('cover_image_description', { ns: 'page-directories' })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CoverImageField
              id="cover-image-front"
              label={t('cover_image_front_label', { ns: 'page-directories' })}
              imageUrl={coverImageUrlFront}
              onChange={setCoverImageUrlFront}
              directoryId={directoryId}
              disabled={isSubmitting}
            />

            <CoverImageField
              id="cover-image-back"
              label={t('cover_image_back_label', { ns: 'page-directories' })}
              imageUrl={coverImageUrlBack}
              onChange={setCoverImageUrlBack}
              directoryId={directoryId}
              disabled={isSubmitting}
            />
          </div>

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
