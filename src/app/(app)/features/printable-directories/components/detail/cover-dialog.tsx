'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';

import { usePrintableDirectoryCapability } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import {
  PrintableDirectoryCoverDto,
  PrintableDirectoryLocalizedValuesDto,
} from '@/lib/api/generated/data-contracts';

import {
  CoverDialogValues,
  EMPTY_LOCALIZED_VALUES,
} from '../../utils/dialog-types';
import { DirectoryImageField } from './directory-image-field';
import { LocalizedFieldTable } from './localized-field-table';

type CoverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  initialValues: CoverDialogValues;
  /** Receives only the fields the current user is allowed to change. */
  onSubmit: (values: PrintableDirectoryCoverDto) => Promise<void>;
  directoryId: string;
  primaryLanguage: string;
  locales: string[];
};

/**
 * Title and description are basic; the cover images need the Cover
 * Customization capability (enforced again by `updatePrintableDirectory`).
 */
export function CoverDialog({
  open,
  onOpenChange,
  isSubmitting,
  initialValues,
  onSubmit,
  directoryId,
  primaryLanguage,
  locales,
}: CoverDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const canCustomizeCover =
    usePrintableDirectoryCapability('coverCustomization');
  const [title, setTitle] = useState<PrintableDirectoryLocalizedValuesDto>(
    EMPTY_LOCALIZED_VALUES,
  );
  const [description, setDescription] =
    useState<PrintableDirectoryLocalizedValuesDto>(EMPTY_LOCALIZED_VALUES);
  const [coverImageUrlFront, setCoverImageUrlFront] = useState('');
  const [coverImageUrlBack, setCoverImageUrlBack] = useState('');

  const reset = () => {
    setTitle(initialValues.titleLocalized);
    setDescription(initialValues.descriptionLocalized);
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
      titleLocalized: title,
      descriptionLocalized: description,
      ...(canCustomizeCover ? { coverImageUrlFront, coverImageUrlBack } : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t('edit_cover', { ns: 'page-directories' })}
          </DialogTitle>
          {canCustomizeCover && (
            <DialogDescription>
              {t('cover_image_description', { ns: 'page-directories' })}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {canCustomizeCover && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DirectoryImageField
                kind="cover"
                id="cover-image-front"
                label={t('cover_image_front_label', { ns: 'page-directories' })}
                imageUrl={coverImageUrlFront}
                onChange={setCoverImageUrlFront}
                directoryId={directoryId}
                disabled={isSubmitting}
              />

              <DirectoryImageField
                kind="cover"
                id="cover-image-back"
                label={t('cover_image_back_label', { ns: 'page-directories' })}
                imageUrl={coverImageUrlBack}
                onChange={setCoverImageUrlBack}
                directoryId={directoryId}
                disabled={isSubmitting}
              />
            </div>
          )}

          <LocalizedFieldTable
            label={t('title_label', { ns: 'page-directories' })}
            value={title}
            primaryLanguage={primaryLanguage}
            locales={locales}
            onChange={setTitle}
          />

          <LocalizedFieldTable
            label={t('description_label', { ns: 'page-directories' })}
            value={description}
            multiline
            primaryLanguage={primaryLanguage}
            locales={locales}
            onChange={setDescription}
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
