'use client';

import { BookPlus, LoaderCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/(app)/shared/components/ui/dialog';
import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { createPrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySection';
import { createPrintableDirectorySource } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySource';
import { getPrintableDirectories } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectories';
import { canAccessPrintableDirectories } from '@/app/(app)/shared/utils/canAccessPrintableDirectories';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
} from '@/lib/api/generated/data-contracts';

import { getPrintableDirectoryLocalizedText } from '@/app/(app)/features/printable-directories/utils';

type SaveSourceToDirectoryButtonProps = {
  kind: SaveSourceKind;
  sourcePayload: PrintableDirectoryControllerCreateSourcePayload;
  triggerLabel?: string;
  triggerAriaLabel?: string;
  triggerDisabled?: boolean;
  triggerMode?: 'button' | 'icon';
};

type SaveSourceKind = 'query' | 'favorites_list';

export function SaveSourceToDirectoryButton({
  kind,
  sourcePayload,
  triggerLabel,
  triggerAriaLabel,
  triggerDisabled,
  triggerMode = 'button',
}: SaveSourceToDirectoryButtonProps) {
  const { t, i18n } = useTranslation(['common']);
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appConfig = useAppConfig();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [directories, setDirectories] = useState<
    PrintableDirectoryResponseDto[]
  >([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  const hasAccess = canAccessPrintableDirectories(
    session.data?.user?.email,
    appConfig,
  );

  const selectedDirectory = useMemo(
    () => directories.find((directory) => directory.id === selectedDirectoryId),
    [directories, selectedDirectoryId],
  );

  const kindTranslationNamespace =
    kind === 'query'
      ? 'printable_directories.save_query'
      : 'printable_directories.save_list';

  const defaultSectionHeading =
    kind === 'query' ? 'Saved searches' : 'Saved lists';

  const resolvedTriggerLabel =
    triggerLabel ??
    (triggerMode === 'icon'
      ? t(`${kindTranslationNamespace}.open`, {
          ns: 'common',
          defaultValue: t('call_to_action.save', { ns: 'common' }),
        })
      : t('call_to_action.save', { ns: 'common' }));

  const dialogTitle = t(`${kindTranslationNamespace}.dialog_title`, {
    ns: 'common',
  });

  const dialogDescription = t(
    `${kindTranslationNamespace}.dialog_description`,
    {
      ns: 'common',
    },
  );

  const createSectionOptionLabel = t(
    `${kindTranslationNamespace}.create_section_option`,
    {
      ns: 'common',
      heading: defaultSectionHeading,
    },
  );

  const saveSuccessMessage = t(`${kindTranslationNamespace}.success`, {
    ns: 'common',
  });

  const saveErrorMessage = t(`${kindTranslationNamespace}.error`, {
    ns: 'common',
  });

  useEffect(() => {
    if (!open || !hasAccess) return;

    let mounted = true;

    async function loadDirectories() {
      setIsLoading(true);

      try {
        const result = await getPrintableDirectories(appConfig.tenantId);
        if (!mounted) return;

        const items = result.items ?? [];
        setDirectories(items);

        const requestedDirectoryId = searchParams.get('pdid') ?? '';
        const requestedSectionId = searchParams.get('pdsid') ?? '';

        const preferredDirectory = requestedDirectoryId
          ? items.find((directory) => directory.id === requestedDirectoryId)
          : undefined;

        const nextDirectoryId = preferredDirectory?.id ?? items[0]?.id ?? '';
        setSelectedDirectoryId(nextDirectoryId);

        const directorySections =
          preferredDirectory?.sections ??
          items.find((directory) => directory.id === nextDirectoryId)
            ?.sections ??
          [];

        const preferredSection = requestedSectionId
          ? directorySections.find(
              (section) => section.id === requestedSectionId,
            )
          : undefined;

        setSelectedSectionId(
          preferredSection?.id ?? directorySections[0]?.id ?? '',
        );

        if (requestedDirectoryId || requestedSectionId) {
          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.delete('pdid');
          nextParams.delete('pdsid');
          const nextQuery = nextParams.toString();
          router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
            scroll: false,
          });
        }
      } catch {
        if (!mounted) return;
        toast.error(
          t('printable_directories.save_source.unable_load_directories_error', {
            ns: 'common',
          }),
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDirectories();

    return () => {
      mounted = false;
    };
  }, [open, hasAccess, appConfig.tenantId, t, searchParams, router, pathname]);

  if (!hasAccess) {
    return null;
  }

  const handleDirectoryChange = (directoryId: string) => {
    setSelectedDirectoryId(directoryId);

    const directory = directories.find((item) => item.id === directoryId);
    setSelectedSectionId(directory?.sections?.[0]?.id ?? '');
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (!selectedDirectory) {
        toast.error(
          t('printable_directories.save_source.select_directory_first_error', {
            ns: 'common',
          }),
        );
        return;
      }

      let sectionId = selectedSectionId;

      if (!sectionId) {
        const createdSection = await createPrintableDirectorySection(
          selectedDirectory.id,
          defaultSectionHeading,
          appConfig.tenantId,
        );

        if (!createdSection?.id) {
          toast.error(
            t('printable_directories.save_source.unable_create_section_error', {
              ns: 'common',
            }),
          );
          return;
        }

        sectionId = createdSection.sections?.at(-1)?.id ?? '';
      }

      if (!sectionId) {
        toast.error(
          t('printable_directories.save_source.unable_select_section_error', {
            ns: 'common',
          }),
        );
        return;
      }

      const saved = await createPrintableDirectorySource({
        directoryId: selectedDirectory.id,
        sectionId,
        payload: sourcePayload,
        tenantId: appConfig.tenantId,
      });

      if (!saved) {
        toast.error(saveErrorMessage);
        return;
      }

      toast.success(saveSuccessMessage);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {triggerMode === 'icon' ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setOpen(true)}
          disabled={isSaving || triggerDisabled}
          aria-label={triggerAriaLabel ?? resolvedTriggerLabel}
        >
          <BookPlus className="size-4" />
        </Button>
      ) : (
        <Button
          size="default"
          variant="outline"
          className="gap-2"
          onClick={() => setOpen(true)}
          disabled={isSaving || triggerDisabled}
          aria-label={triggerAriaLabel}
        >
          <BookPlus className="size-4" />
          <span>{resolvedTriggerLabel}</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent closeLabel={t('call_to_action.close', { ns: 'common' })}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-3 text-center">
              <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
              <Typography variant="paragraph" size="sm" textColor="secondary">
                {t('printable_directories.save_source.loading_directories', {
                  ns: 'common',
                })}
              </Typography>
            </div>
          ) : directories.length === 0 ? (
            <Typography
              variant="paragraph"
              size="sm"
              textColor="secondary"
              className="py-3"
            >
              {t('printable_directories.save_source.no_directories_found', {
                ns: 'common',
              })}
            </Typography>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="save-source-directory">
                  {t('printable_directories.save_source.directory_label', {
                    ns: 'common',
                  })}
                </Label>
                <Select
                  value={selectedDirectoryId}
                  onValueChange={handleDirectoryChange}
                >
                  <SelectTrigger id="save-source-directory">
                    <SelectValue
                      placeholder={t(
                        'printable_directories.save_source.select_directory_placeholder',
                        {
                          ns: 'common',
                        },
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {directories.map((directory) => (
                      <SelectItem key={directory.id} value={directory.id}>
                        {directory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="save-source-section">
                  {t('printable_directories.save_source.section_label', {
                    ns: 'common',
                  })}
                </Label>
                <Select
                  value={selectedSectionId || '__create__'}
                  onValueChange={(value) =>
                    setSelectedSectionId(value === '__create__' ? '' : value)
                  }
                >
                  <SelectTrigger id="save-source-section">
                    <SelectValue
                      placeholder={t(
                        'printable_directories.save_source.select_section_placeholder',
                        {
                          ns: 'common',
                        },
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedDirectory?.sections ?? []).map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {getPrintableDirectoryLocalizedText(
                          section.headingLocalized,
                          i18n.language,
                        )}
                      </SelectItem>
                    ))}
                    <SelectItem value="__create__">
                      {createSectionOptionLabel}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              {t('call_to_action.cancel', { ns: 'common' })}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving || isLoading || directories.length === 0}
            >
              {t('call_to_action.save', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
