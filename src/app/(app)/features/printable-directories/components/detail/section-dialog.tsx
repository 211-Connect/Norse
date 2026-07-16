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

import { SectionDialogValues } from '../../utils/dialog-types';
import { LocalizedFieldTable } from './localized-field-table';

type SectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  title: string;
  submitLabel: string;
  defaultMaxResources: number;
  maxResourcesConfigurable: boolean;
  initialValues?: SectionDialogValues;
  onSubmit: (values: SectionDialogValues) => Promise<void>;
};

export function SectionDialog({
  open,
  onOpenChange,
  isSubmitting,
  title,
  submitLabel,
  defaultMaxResources,
  maxResourcesConfigurable,
  initialValues,
  onSubmit,
}: SectionDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const [headingValues, setHeadingValues] = useState<Record<string, string>>(
    {},
  );
  const [descriptionValues, setDescriptionValues] = useState<
    Record<string, string>
  >({});
  const [maxResources, setMaxResources] = useState<string>(
    String(defaultMaxResources),
  );

  const reset = () => {
    setHeadingValues(initialValues?.headingLocalized.values ?? {});
    setDescriptionValues(initialValues?.descriptionLocalized.values ?? {});
    setMaxResources(
      String(
        maxResourcesConfigurable
          ? (initialValues?.maxResources ?? defaultMaxResources)
          : defaultMaxResources,
      ),
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
    const maxResourcesValue = maxResourcesConfigurable
      ? Number.isFinite(max)
        ? max
        : defaultMaxResources
      : defaultMaxResources;

    await onSubmit({
      headingLocalized: { values: headingValues },
      descriptionLocalized: { values: descriptionValues },
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
            values={headingValues}
            onChange={(locale, next) =>
              setHeadingValues((previous) => ({
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
            <Label htmlFor="section-max-resources">
              {t('max_resources', { ns: 'page-directories' })}
            </Label>
            <Input
              id="section-max-resources"
              type="number"
              min={1}
              max={1000}
              value={maxResources}
              disabled={!maxResourcesConfigurable}
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
