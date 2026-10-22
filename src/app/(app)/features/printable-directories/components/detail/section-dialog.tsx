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
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';

import { PrintableDirectoryLocalizedValuesDto } from '@/lib/api/generated/data-contracts';

import { DEFAULT_MAX_RESOURCES } from '../../utils/constants';
import {
  EMPTY_LOCALIZED_VALUES,
  SectionDialogValues,
} from '../../utils/dialog-types';
import { LocalizedFieldTable } from './localized-field-table';

type SectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  title: string;
  submitLabel: string;
  initialValues?: SectionDialogValues;
  onSubmit: (values: SectionDialogValues) => Promise<void>;
  primaryLanguage: string;
  locales: string[];
};

export function SectionDialog({
  open,
  onOpenChange,
  isSubmitting,
  title,
  submitLabel,
  initialValues,
  onSubmit,
  primaryLanguage,
  locales,
}: SectionDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [heading, setHeading] = useState<PrintableDirectoryLocalizedValuesDto>(
    EMPTY_LOCALIZED_VALUES,
  );
  const [description, setDescription] =
    useState<PrintableDirectoryLocalizedValuesDto>(EMPTY_LOCALIZED_VALUES);
  const [maxResources, setMaxResources] = useState<string>(
    String(DEFAULT_MAX_RESOURCES),
  );

  const reset = () => {
    setHeading(initialValues?.headingLocalized ?? EMPTY_LOCALIZED_VALUES);
    setDescription(
      initialValues?.descriptionLocalized ?? EMPTY_LOCALIZED_VALUES,
    );
    setMaxResources(
      String(initialValues?.maxResources ?? DEFAULT_MAX_RESOURCES),
    );
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
    const max = Number(maxResources);
    const maxResourcesValue = Number.isFinite(max)
      ? max
      : DEFAULT_MAX_RESOURCES;

    await onSubmit({
      headingLocalized: heading,
      descriptionLocalized: description,
      maxResources: maxResourcesValue,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <LocalizedFieldTable
            label={t('section_heading_label', { ns: 'page-directories' })}
            value={heading}
            primaryLanguage={primaryLanguage}
            locales={locales}
            onChange={setHeading}
          />

          <LocalizedFieldTable
            label={t('description_label', { ns: 'page-directories' })}
            value={description}
            multiline
            primaryLanguage={primaryLanguage}
            locales={locales}
            onChange={setDescription}
          />

          <div className="space-y-2">
            <Label htmlFor="section-max-resources">
              {t('max_resources', { ns: 'page-directories' })}
            </Label>
            <Input
              id="section-max-resources"
              type="number"
              min={1}
              max={1000}
              value={maxResources}
              onChange={(event) => setMaxResources(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={handleSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
