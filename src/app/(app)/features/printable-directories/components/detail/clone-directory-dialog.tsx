'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/app/(app)/shared/components/ui/button';
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Input } from '@/app/(app)/shared/components/ui/input';
import { Label } from '@/app/(app)/shared/components/ui/label';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { createPrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectory';
import { createPrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySection';
import { createPrintableDirectorySource } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySource';
import { updatePrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectory';
import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';

import { randomSlugSuffix, slugify } from '../../utils';

type CloneDirectoryDialogProps = {
  open: boolean;
  directory: PrintableDirectoryResponseDto;
  onOpenChange: (open: boolean) => void;
  onCloned: (directory: PrintableDirectoryResponseDto) => void;
};

type CloneOptions = {
  generalInfo: boolean;
  cover: boolean;
  header: boolean;
  footer: boolean;
  sources: boolean;
};

const DEFAULT_OPTIONS: CloneOptions = {
  generalInfo: true,
  cover: true,
  header: true,
  footer: true,
  sources: true,
};

const toSourcePayload = (
  source: PrintableDirectoryResponseDto['sections'][number]['sources'][number],
): PrintableDirectoryControllerCreateSourcePayload | null => {
  if (source.type === 'query' && source.query) {
    return {
      type: 'query',
      query: {
        title: source.query.title ?? undefined,
        params: source.query.params,
      },
    };
  }

  if (source.type === 'favorites_list' && source.favoriteList?.id) {
    return {
      type: 'favorites_list',
      favoritesListId: source.favoriteList.id,
    };
  }

  if (source.type === 'resource_ids') {
    return {
      type: 'resource_ids',
      resourceIds: source.resources.map((resource) => resource.id),
    };
  }

  return null;
};

export function CloneDirectoryDialog({
  open,
  directory,
  onOpenChange,
  onCloned,
}: CloneDirectoryDialogProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();
  const [cloneName, setCloneName] = useState('');
  const [options, setOptions] = useState<CloneOptions>(DEFAULT_OPTIONS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCloneName(
      t('clone_name_default', {
        ns: 'page-directories',
        name: directory.name,
        defaultValue: `${directory.name} (copy)`,
      }),
    );
    setOptions(DEFAULT_OPTIONS);
  }, [open, directory.name, t]);

  const sourceSections = useMemo(
    () =>
      [...directory.sections].sort(
        (first, second) => first.order - second.order,
      ),
    [directory.sections],
  );

  const setOption = (name: keyof CloneOptions, value: boolean) => {
    setOptions((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const trimmedName = cloneName.trim();
    if (!trimmedName) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createResult = await createPrintableDirectory(
        {
          name: trimmedName,
          slug: `${slugify(trimmedName)}-${randomSlugSuffix()}`,
          ...(options.generalInfo
            ? {
                accessPolicy: directory.accessPolicy,
                resourceLayout: directory.resourceLayout,
                isBookletLayout: directory.isBookletLayout,
                defaultQueryConfig: directory.defaultQueryConfig,
              }
            : {}),
        },
        appConfig.tenantId,
      );

      if (!createResult.success) {
        toast.error(t('clone_failed', { ns: 'page-directories' }));
        return;
      }

      const created = createResult.data;

      const updatePayload: Parameters<typeof updatePrintableDirectory>[1] = {};

      if (options.cover) {
        updatePayload.cover = {
          titleLocalized: {
            values: directory.cover.titleLocalized?.values ?? {},
          },
          descriptionLocalized: {
            values: directory.cover.descriptionLocalized?.values ?? {},
          },
          primaryColor: directory.cover.primaryColor ?? undefined,
        };
      }

      if (options.header) {
        updatePayload.header = {
          layout: directory.header.layout,
          textLocalized: {
            values: directory.header.textLocalized?.values ?? {},
          },
        };
      }

      if (options.footer) {
        updatePayload.footer = {
          layout: directory.footer.layout,
          textLocalized: {
            values: directory.footer.textLocalized?.values ?? {},
          },
        };
      }

      let latestDirectory = created;

      if (Object.keys(updatePayload).length > 0) {
        const updateResult = await updatePrintableDirectory(
          created.id,
          updatePayload,
          appConfig.tenantId,
        );

        if (!updateResult.success) {
          toast.error(t('clone_failed', { ns: 'page-directories' }));
          return;
        }

        latestDirectory = updateResult.data;
      }

      if (options.sources) {
        for (const sourceSection of sourceSections) {
          const sectionCreated = await createPrintableDirectorySection(
            latestDirectory.id,
            {
              headingLocalized: {
                values: sourceSection.headingLocalized.values ?? {},
              },
              descriptionLocalized: {
                values: sourceSection.descriptionLocalized.values ?? {},
              },
              maxResources: sourceSection.maxResources,
            },
            appConfig.tenantId,
          );

          if (!sectionCreated) {
            toast.error(t('clone_failed', { ns: 'page-directories' }));
            return;
          }

          latestDirectory = sectionCreated;
          const targetSection = [...latestDirectory.sections].sort(
            (first, second) => first.order - second.order,
          )[latestDirectory.sections.length - 1];

          if (!targetSection) {
            toast.error(t('clone_failed', { ns: 'page-directories' }));
            return;
          }

          const orderedSources = [...sourceSection.sources].sort(
            (first, second) => first.order - second.order,
          );

          for (const source of orderedSources) {
            const payload = toSourcePayload(source);
            if (!payload) {
              continue;
            }

            const sourceCreated = await createPrintableDirectorySource({
              directoryId: latestDirectory.id,
              sectionId: targetSection.id,
              payload,
              tenantId: appConfig.tenantId,
            });

            if (!sourceCreated) {
              toast.error(t('clone_failed', { ns: 'page-directories' }));
              return;
            }

            latestDirectory = sourceCreated;
          }
        }
      }

      toast.success(t('clone_success', { ns: 'page-directories' }));
      onOpenChange(false);
      onCloned(latestDirectory);
    } catch {
      toast.error(t('clone_failed', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('clone_directory_title', { ns: 'page-directories' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="clone-directory-name">
              {t('name_label', { ns: 'page-directories' })}
            </Label>
            <Input
              id="clone-directory-name"
              value={cloneName}
              onChange={(event) => setCloneName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t('clone_options_label', { ns: 'page-directories' })}
            </Label>

            <div className="space-y-2 rounded-md border p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={options.generalInfo}
                  onCheckedChange={(value) =>
                    setOption('generalInfo', value === true)
                  }
                />
                <span>
                  {t('clone_options.general_info', { ns: 'page-directories' })}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={options.cover}
                  onCheckedChange={(value) =>
                    setOption('cover', value === true)
                  }
                />
                <span>
                  {t('clone_options.cover', { ns: 'page-directories' })}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={options.header}
                  onCheckedChange={(value) =>
                    setOption('header', value === true)
                  }
                />
                <span>
                  {t('clone_options.header', { ns: 'page-directories' })}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={options.footer}
                  onCheckedChange={(value) =>
                    setOption('footer', value === true)
                  }
                />
                <span>
                  {t('clone_options.footer', { ns: 'page-directories' })}
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={options.sources}
                  onCheckedChange={(value) =>
                    setOption('sources', value === true)
                  }
                />
                <span>
                  {t('clone_options.sources', { ns: 'page-directories' })}
                </span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('call_to_action.cancel', { ns: 'common' })}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!cloneName.trim()}
            loading={isSubmitting}
          >
            {isSubmitting
              ? t('cloning', { ns: 'page-directories' })
              : t('clone_directory', { ns: 'page-directories' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
