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
import { usePrintableDirectoryCapability } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import { updatePrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectory';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';

import { useShareUrlBase } from '../../hooks/use-share-url-base';
import { getLanguageName } from '@/app/(app)/shared/lib/language-names';

import { getAccessPolicyLabel, orderLocales } from '../../utils';
import { EditDirectoryDialog } from '../edit-directory-dialog';
import { CopyShareUrlButton } from './copy-share-url-button';
import { DirectoryImageThumbnail } from './directory-image-thumbnail';

const haveSameItems = (first: string[], second: string[]) =>
  first.length === second.length &&
  first.every((item) => second.includes(item));

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
  const shareUrlBase = useShareUrlBase();
  const canUploadLogo = usePrintableDirectoryCapability('logoUpload');
  const hideAccessPolicy =
    appConfig.printableDirectories.accessMode === 'everyone';

  const handleSubmit = async (values: {
    name: string;
    slug: string;
    accessPolicy?: PrintableDirectoryResponseDto['accessPolicy'];
    locales: string[];
    logoUrl?: string;
    defaultQueryConfig: PrintableDirectoryResponseDto['defaultQueryConfig'];
  }) => {
    setIsSubmitting(true);

    try {
      // The user chose this slug explicitly, so a collision is reported
      // rather than silently suffixed (that only happens at creation).
      const result = await updatePrintableDirectory(
        directory.id,
        {
          name: values.name,
          slug: values.slug,
          // Changing languages re-translates the whole directory for users
          // with automatic translation, so only send them when they changed.
          ...(haveSameItems(values.locales, directory.locales)
            ? {}
            : { locales: values.locales }),
          defaultQueryConfig: values.defaultQueryConfig,
          ...(values.logoUrl !== undefined &&
          values.logoUrl !== (directory.logoUrl ?? '')
            ? { logoUrl: values.logoUrl }
            : {}),
          ...(values.accessPolicy ? { accessPolicy: values.accessPolicy } : {}),
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
            aria-label={t('edit_named', {
              ns: 'page-directories',
              name: t('general_info_title', { ns: 'page-directories' }),
            })}
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
              {t('share_url_label', { ns: 'page-directories' })}:
            </span>{' '}
            {directory.slug ? (
              <>
                {`${shareUrlBase}${directory.slug}`}
                <CopyShareUrlButton
                  url={`${shareUrlBase}${directory.slug}`}
                  className="-my-0.5 ml-1 align-middle"
                />
              </>
            ) : (
              '-'
            )}
          </Typography>
          <Typography as="p" variant="paragraph" size="sm">
            <span className="font-medium">
              {t('languages_label', { ns: 'page-directories' })}:
            </span>{' '}
            {orderLocales(directory.locales, directory.primaryLanguage)
              .map((locale) => getLanguageName(locale, { englishName: true }))
              .join(', ')}
          </Typography>
          {!hideAccessPolicy && (
            <Typography as="p" variant="paragraph" size="sm">
              <span className="font-medium">
                {t('access_policy.label', { ns: 'page-directories' })}:
              </span>{' '}
              {getAccessPolicyLabel(directory.accessPolicy, t)}
            </Typography>
          )}
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
              {t('default_query_config.radius_label', {
                ns: 'page-directories',
                defaultValue: 'Default radius',
              })}
              :
            </span>{' '}
            {directory.defaultQueryConfig?.radius ?? '-'}
          </Typography>
          {canUploadLogo && (
            <div className="space-y-1">
              <Typography as="p" variant="paragraph" size="sm">
                <span className="font-medium">
                  {t('logo_label', { ns: 'page-directories' })}:
                </span>{' '}
                {!directory.logoUrl &&
                  t('logo_default', { ns: 'page-directories' })}
              </Typography>
              {directory.logoUrl && (
                <DirectoryImageThumbnail
                  src={directory.logoUrl}
                  alt={t('logo_label', { ns: 'page-directories' })}
                  kind="logo"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EditDirectoryDialog
        open={open}
        directoryId={directory.id}
        isSubmitting={isSubmitting}
        slugError={slugError}
        onSlugChange={() => setSlugError(null)}
        initialValues={{
          name: directory.name,
          slug: directory.slug,
          logoUrl: directory.logoUrl ?? '',
          accessPolicy: directory.accessPolicy,
          primaryLanguage: directory.primaryLanguage,
          locales: directory.locales,
          defaultQueryConfig: directory.defaultQueryConfig,
        }}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
      />
    </>
  );
}
