'use client';

import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/(app)/shared/components/ui/card';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { updatePrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectory';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { CoverDialog } from './cover-dialog';
import { CoverImageThumbnail } from './cover-image-thumbnail';
import { CoverDialogValues } from '../../utils/dialog-types';
import {
  getPrintableDirectoryLocalizedText,
  toLocalizedValues,
} from '../../utils';

type CoverCardProps = {
  directory: PrintableDirectoryResponseDto;
  onDirectoryUpdated: (directory: PrintableDirectoryResponseDto) => void;
};

function CoverImagePreview({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) {
  return (
    <div className="space-y-1">
      <Typography as="p" variant="paragraph" size="sm" className="font-medium">
        {label}
      </Typography>
      {url ? (
        <CoverImageThumbnail src={url} alt={label} />
      ) : (
        <Typography variant="paragraph" size="sm" textColor="secondary">
          -
        </Typography>
      )}
    </div>
  );
}

export function CoverCard({ directory, onDirectoryUpdated }: CoverCardProps) {
  const { t, i18n } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: CoverDialogValues) => {
    setIsSubmitting(true);

    try {
      const updated = await updatePrintableDirectory(
        directory.id,
        {
          cover: {
            titleLocalized: values.titleLocalized,
            descriptionLocalized: values.descriptionLocalized,
            primaryColor: values.primaryColor || undefined,
            layoutType: 'default',
            coverImageUrlFront: values.coverImageUrlFront ?? '',
            coverImageUrlBack: values.coverImageUrlBack ?? '',
          },
        },
        appConfig.tenantId,
      );

      if (!updated) {
        toast.error(t('unable_to_update_cover', { ns: 'page-directories' }));
        return;
      }

      onDirectoryUpdated(updated);
      toast.success(t('cover_updated', { ns: 'page-directories' }));
      setOpen(false);
    } catch {
      toast.error(t('unable_to_update_cover', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="mb-1 text-lg">
            {t('cover_title', { ns: 'page-directories' })}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => setOpen(true)}
          >
            <PencilIcon className="size-4" aria-hidden="true" />
            {t('call_to_action.edit', { ns: 'common' })}
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('title_label', { ns: 'page-directories' })}:
            </span>{' '}
            {getPrintableDirectoryLocalizedText(
              directory.cover.titleLocalized,
              i18n.language,
            )}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('description_label', { ns: 'page-directories' })}:
            </span>{' '}
            {getPrintableDirectoryLocalizedText(
              directory.cover.descriptionLocalized,
              i18n.language,
            )}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('primary_color_label', { ns: 'page-directories' })}:
            </span>{' '}
            {String(directory.cover.primaryColor ?? '-')}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('layout_type_label', { ns: 'page-directories' })}:
            </span>{' '}
            {directory.cover.layoutType ?? 'default'}
          </Typography>
          <div className="flex flex-wrap gap-4 pt-1">
            <CoverImagePreview
              label={t('cover_image_front_label', { ns: 'page-directories' })}
              url={directory.cover.coverImageUrlFront}
            />
            <CoverImagePreview
              label={t('cover_image_back_label', { ns: 'page-directories' })}
              url={directory.cover.coverImageUrlBack}
            />
          </div>
        </CardContent>
      </Card>

      <CoverDialog
        open={open}
        onOpenChange={setOpen}
        isSubmitting={isSubmitting}
        directoryId={directory.id}
        initialValues={{
          titleLocalized: toLocalizedValues(directory.cover.titleLocalized),
          descriptionLocalized: toLocalizedValues(
            directory.cover.descriptionLocalized,
          ),
          primaryColor: String(directory.cover.primaryColor ?? ''),
          coverImageUrlFront: directory.cover.coverImageUrlFront ?? '',
          coverImageUrlBack: directory.cover.coverImageUrlBack ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
