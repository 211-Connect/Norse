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

import { getAccessPolicyLabel, getResourceLayoutLabel } from '../../utils';
import { CreateDirectoryDialog } from '../create-directory-dialog';

type GeneralInfoCardProps = {
  directory: PrintableDirectoryResponseDto;
  onDirectoryUpdated: (directory: PrintableDirectoryResponseDto) => void;
};

export function GeneralInfoCard({
  directory,
  onDirectoryUpdated,
}: GeneralInfoCardProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);

  const handleSubmit = async (values: {
    name: string;
    slug: string;
    resourceLayout: PrintableDirectoryResponseDto['resourceLayout'];
    accessPolicy: PrintableDirectoryResponseDto['accessPolicy'];
    isBookletLayout: boolean;
    defaultQueryConfig: PrintableDirectoryResponseDto['defaultQueryConfig'];
  }) => {
    setIsSubmitting(true);

    try {
      const result = await updatePrintableDirectory(
        directory.id,
        {
          name: values.name,
          slug: values.slug,
          resourceLayout: values.resourceLayout,
          accessPolicy: values.accessPolicy,
          isBookletLayout: values.isBookletLayout,
          defaultQueryConfig: values.defaultQueryConfig,
        },
        appConfig.tenantId,
      );

      if (!result.success) {
        if (result.error === 'slug_taken') {
          setSlugError(t('slug_taken_error', { ns: 'page-directories' }));
        } else {
          toast.error(
            t('unable_to_update_directory', { ns: 'page-directories' }),
          );
        }
        return;
      }

      onDirectoryUpdated(result.data);
      toast.success(t('directory_updated', { ns: 'page-directories' }));
      setSlugError(null);
      setOpen(false);
    } catch {
      toast.error(t('unable_to_update_directory', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="mb-1 text-lg">
            {t('general_info_title', { ns: 'page-directories' })}
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            className="gap-1"
            onClick={() => {
              setSlugError(null);
              setOpen(true);
            }}
          >
            <PencilIcon className="size-4" aria-hidden="true" />
            {t('call_to_action.edit', { ns: 'common' })}
          </Button>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('name_label', { ns: 'page-directories' })}:
            </span>{' '}
            {directory.name}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('slug_label', { ns: 'page-directories' })}:
            </span>{' '}
            {directory.slug || '-'}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('resource_layout.label', { ns: 'page-directories' })}:
            </span>{' '}
            {getResourceLayoutLabel(directory.resourceLayout, t)}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('access_policy.label', { ns: 'page-directories' })}:
            </span>{' '}
            {getAccessPolicyLabel(directory.accessPolicy, t)}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('booklet_layout.label', { ns: 'page-directories' })}:
            </span>{' '}
            {directory.isBookletLayout
              ? t('booklet_layout.enabled', { ns: 'page-directories' })
              : t('booklet_layout.disabled', { ns: 'page-directories' })}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('default_query_config.location_name_label', {
                ns: 'page-directories',
              })}
              :
            </span>{' '}
            {directory.defaultQueryConfig?.locationName || '-'}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('default_query_config.coords_label', {
                ns: 'page-directories',
                defaultValue: 'Default coordinates',
              })}
              :
            </span>{' '}
            {directory.defaultQueryConfig?.coords
              ? `${directory.defaultQueryConfig.coords.latitude}, ${directory.defaultQueryConfig.coords.longitude}`
              : '-'}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('default_query_config.radius_label', {
                ns: 'page-directories',
                defaultValue: 'Default radius',
              })}
              :
            </span>{' '}
            {directory.defaultQueryConfig?.radius ?? '-'}
          </Typography>
        </CardContent>
      </Card>

      <CreateDirectoryDialog
        open={open}
        isSubmitting={isSubmitting}
        mode="edit"
        slugError={slugError}
        onSlugChange={() => setSlugError(null)}
        initialValues={{
          name: directory.name,
          slug: directory.slug,
          accessPolicy: directory.accessPolicy,
          resourceLayout: directory.resourceLayout,
          isBookletLayout: directory.isBookletLayout,
          defaultQueryConfig: directory.defaultQueryConfig,
        }}
        title={t('edit_directory', { ns: 'page-directories' })}
        submitLabel={t('call_to_action.save', { ns: 'common' })}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
