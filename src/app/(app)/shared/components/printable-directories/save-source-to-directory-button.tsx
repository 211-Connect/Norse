'use client';

import { BookPlus, LoaderCircle, TriangleAlert } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Checkbox } from '@/app/(app)/shared/components/ui/checkbox';
import { Label } from '@/app/(app)/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/(app)/shared/components/ui/tooltip';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import {
  QuerySourceParams,
  toQuerySourceParams,
} from '@/app/(app)/shared/utils/printableDirectoryQueryParams';
import { PRINTABLE_DIRECTORY_CONTEXT_PARAMS } from '@/app/(app)/shared/utils/printableDirectorySearchContext';
import { PrintableDirectorySearchContext } from '@/app/(app)/shared/hooks/use-printable-directory-search-context';
import { createPrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySection';
import { createPrintableDirectorySource } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySource';
import { getPrintableDirectories } from '@/app/(app)/shared/serverActions/printableDirectories/getPrintableDirectories';
import { updatePrintableDirectoryQuerySource } from '@/app/(app)/shared/serverActions/printableDirectories/updatePrintableDirectoryQuerySource';
import { usePrintableDirectoryAccess } from '@/app/(app)/shared/hooks/use-printable-directory-capability';
import { Button } from '@/app/(app)/shared/components/ui/button';
import {
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryResponseDto,
  PrintableDirectorySourceResponseDto,
} from '@/lib/api/generated/data-contracts';

import {
  formatQueryParamValue,
  getLocationConflict,
  getPrintableDirectoryLocalizedText,
  LOCATION_QUERY_PARAM_KEYS,
  matchesDefaultLocation,
} from '@/app/(app)/features/printable-directories/utils';

type SaveSourceToDirectoryButtonProps = {
  kind: SaveSourceKind;
  sourcePayload: PrintableDirectoryControllerCreateSourcePayload;
  triggerLabel?: string;
  triggerAriaLabel?: string;
  triggerDisabled?: boolean;
  triggerMode?: 'button' | 'icon';
  /**
   * The directory section (and source) the user came from. When set, Save
   * targets it directly — updating the source, or adding to the section —
   * instead of asking which directory and section to save into.
   */
  directoryContext?: PrintableDirectorySearchContext | null;
};

type SaveSourceKind = 'query' | 'favorites_list';

/**
 * The source keeps its own title while what it searches for (its query or
 * organization) is unchanged, e.g. only filters or location changed, so a
 * title the search page couldn't reproduce isn't replaced by the raw query,
 * such as a taxonomy code.
 */
function getUpdatedSourceTitle(
  source: PrintableDirectorySourceResponseDto,
  nextQuery: { title?: string; params: object },
): string | undefined {
  const previousParams = (source.query?.params ?? {}) as Record<
    string,
    unknown
  >;
  const nextParams = nextQuery.params as Record<string, unknown>;
  const keepsTitle =
    Boolean(source.query?.title) &&
    previousParams.query === nextParams.query &&
    previousParams.organization_id === nextParams.organization_id;

  return keepsTitle ? (source.query?.title ?? undefined) : nextQuery.title;
}

export function SaveSourceToDirectoryButton({
  kind,
  sourcePayload,
  triggerLabel,
  triggerAriaLabel,
  triggerDisabled,
  triggerMode = 'button',
  directoryContext,
}: SaveSourceToDirectoryButtonProps) {
  const { t, i18n } = useTranslation(['common']);
  const appConfig = useAppConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [directories, setDirectories] = useState<
    PrintableDirectoryResponseDto[]
  >([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [includeSearchLocation, setIncludeSearchLocation] = useState(true);

  const { canAccess: hasAccess } = usePrintableDirectoryAccess();

  const selectedDirectory = useMemo(
    () => directories.find((directory) => directory.id === selectedDirectoryId),
    [directories, selectedDirectoryId],
  );

  // What the server would store (`toQuerySourceParams()`), so the preview
  // shows exactly what is saved.
  const sanitizedQueryParams = useMemo(
    () =>
      sourcePayload.type === 'query'
        ? toQuerySourceParams(
            sourcePayload.query.params as Record<string, unknown>,
          )
        : null,
    [sourcePayload],
  );

  const hasLocationParams = useMemo(
    () =>
      Boolean(sanitizedQueryParams) &&
      Array.from(LOCATION_QUERY_PARAM_KEYS).some((key) =>
        Boolean(sanitizedQueryParams?.[key as keyof QuerySourceParams]),
      ),
    [sanitizedQueryParams],
  );

  const effectiveQueryParams = useMemo((): Record<string, unknown> | null => {
    if (!sanitizedQueryParams) return null;

    const params: Record<string, unknown> = { ...sanitizedQueryParams };
    if (!includeSearchLocation) {
      LOCATION_QUERY_PARAM_KEYS.forEach((key) => {
        delete params[key];
      });
    }
    return params;
  }, [sanitizedQueryParams, includeSearchLocation]);

  const locationConflict = useMemo(() => {
    if (!includeSearchLocation || !effectiveQueryParams) return false;

    return getLocationConflict(
      selectedDirectory?.defaultQueryConfig,
      effectiveQueryParams,
    );
  }, [includeSearchLocation, effectiveQueryParams, selectedDirectory]);

  const queryPreviewEntries = useMemo(
    () => (effectiveQueryParams ? Object.entries(effectiveQueryParams) : []),
    [effectiveQueryParams],
  );

  const kindTranslationNamespace =
    kind === 'query'
      ? 'printable_directories.save_query'
      : 'printable_directories.save_list';

  const defaultSectionHeading =
    kind === 'query' ? 'Saved searches' : 'Saved lists';

  const editedSource = directoryContext?.source ?? null;
  const contextSectionName = directoryContext
    ? getPrintableDirectoryLocalizedText(
        directoryContext.section.headingLocalized,
        i18n.language,
        directoryContext.directory.primaryLanguage,
      )
    : '';
  const contextInterpolation = directoryContext
    ? {
        ns: 'common',
        index: directoryContext.sourceIndex + 1,
        section: contextSectionName,
        directory: directoryContext.directory.name,
        interpolation: { escapeValue: false },
      }
    : { ns: 'common' };

  const resolvedTriggerLabel = editedSource
    ? t('printable_directories.edit_source.trigger', { ns: 'common' })
    : (triggerLabel ??
      (triggerMode === 'icon'
        ? t(`${kindTranslationNamespace}.open`, {
            ns: 'common',
            defaultValue: t('call_to_action.save', { ns: 'common' }),
          })
        : t('call_to_action.save', { ns: 'common' })));

  const dialogTitle = editedSource
    ? t('printable_directories.edit_source.dialog_title', { ns: 'common' })
    : t(`${kindTranslationNamespace}.dialog_title`, { ns: 'common' });

  const dialogDescription = editedSource
    ? t(
        'printable_directories.edit_source.dialog_description',
        contextInterpolation,
      )
    : directoryContext
      ? t(
          'printable_directories.save_source.add_to_section_description',
          contextInterpolation,
        )
      : t(`${kindTranslationNamespace}.dialog_description`, { ns: 'common' });

  const createSectionOptionLabel = t(
    `${kindTranslationNamespace}.create_section_option`,
    {
      ns: 'common',
      heading: defaultSectionHeading,
    },
  );

  const saveSuccessMessage = editedSource
    ? t('printable_directories.edit_source.success', { ns: 'common' })
    : t(`${kindTranslationNamespace}.success`, { ns: 'common' });

  const saveErrorMessage = editedSource
    ? t('printable_directories.edit_source.error', { ns: 'common' })
    : t(`${kindTranslationNamespace}.error`, { ns: 'common' });

  useEffect(() => {
    if (!open || !hasAccess) return;

    if (directoryContext) {
      const { directory, section } = directoryContext;
      setDirectories([directory]);
      setSelectedDirectoryId(directory.id);
      setSelectedSectionId(section.id);
      return;
    }

    let mounted = true;

    async function loadDirectories() {
      setIsLoading(true);

      try {
        const result = await getPrintableDirectories(appConfig.tenantId);
        if (!mounted) return;

        const items = result.items ?? [];
        setDirectories(items);

        const requestedDirectoryId =
          searchParams?.get(PRINTABLE_DIRECTORY_CONTEXT_PARAMS.directoryId) ??
          '';
        const requestedSectionId =
          searchParams?.get(PRINTABLE_DIRECTORY_CONTEXT_PARAMS.sectionId) ?? '';

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
  }, [open, hasAccess, appConfig.tenantId, t, searchParams, directoryContext]);

  const openDialog = () => {
    // Don't pin the source to the directory's default location when the
    // search is just using it: leaving it out keeps the source following
    // the default.
    setIncludeSearchLocation(
      !directoryContext ||
        sourcePayload.type !== 'query' ||
        !matchesDefaultLocation(
          directoryContext.directory.defaultQueryConfig,
          sourcePayload.query.params as Record<string, unknown>,
        ),
    );
    setOpen(true);
  };

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

      const effectivePayload: PrintableDirectoryControllerCreateSourcePayload =
        sourcePayload.type === 'query' && effectiveQueryParams
          ? {
              ...sourcePayload,
              query: { ...sourcePayload.query, params: effectiveQueryParams },
            }
          : sourcePayload;

      const saved =
        editedSource && effectivePayload.type === 'query'
          ? await updatePrintableDirectoryQuerySource({
              directoryId: selectedDirectory.id,
              sectionId,
              sourceId: editedSource.id,
              title: getUpdatedSourceTitle(
                editedSource,
                effectivePayload.query,
              ),
              queryParams: effectivePayload.query.params as Record<
                string,
                unknown
              >,
              tenantId: appConfig.tenantId,
            })
          : await createPrintableDirectorySource({
              directoryId: selectedDirectory.id,
              sectionId,
              payload: effectivePayload,
              tenantId: appConfig.tenantId,
            });

      if (!saved) {
        toast.error(saveErrorMessage);
        return;
      }

      const directoryHref =
        i18n.language === appConfig.i18n.defaultLocale
          ? `/directories/${selectedDirectory.id}`
          : `/${i18n.language}/directories/${selectedDirectory.id}`;

      // The user came from this directory to change it: take them back.
      if (directoryContext) {
        toast.success(saveSuccessMessage);
        setOpen(false);
        router.push(directoryHref);
        return;
      }

      toast.success(saveSuccessMessage, {
        action: {
          label: t('printable_directories.save_source.view_directory', {
            ns: 'common',
          }),
          onClick: () => router.push(directoryHref),
        },
      });
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
          onClick={openDialog}
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
          onClick={openDialog}
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
              {directoryContext ? null : (
                <>
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
                        setSelectedSectionId(
                          value === '__create__' ? '' : value,
                        )
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
                              selectedDirectory?.primaryLanguage ?? '',
                            )}
                          </SelectItem>
                        ))}
                        <SelectItem value="__create__">
                          {createSectionOptionLabel}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {sourcePayload.type === 'query' ? (
                <div className="space-y-3 rounded-md border p-3">
                  {hasLocationParams ? (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="save-source-include-location"
                        checked={includeSearchLocation}
                        onCheckedChange={(value) =>
                          setIncludeSearchLocation(value === true)
                        }
                      />
                      <Label
                        htmlFor="save-source-include-location"
                        className="cursor-pointer"
                      >
                        {t(
                          'printable_directories.save_source.include_search_location_label',
                          { ns: 'common' },
                        )}
                      </Label>
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <Typography
                      variant="paragraph"
                      size="sm"
                      textColor="secondary"
                    >
                      {t('printable_directories.save_source.preview_label', {
                        ns: 'common',
                      })}
                    </Typography>
                    <div className="space-y-1">
                      {queryPreviewEntries.length > 0 ? (
                        queryPreviewEntries.map(([key, value]) => (
                          <p key={key} className="break-all text-sm">
                            <span className="font-medium">{key}</span>
                            {LOCATION_QUERY_PARAM_KEYS.has(key) &&
                            locationConflict ? (
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-1 inline-flex align-text-bottom">
                                      <TriangleAlert
                                        className="size-4 text-amber-500"
                                        aria-label={t(
                                          'printable_directories.save_source.location_conflict_warning',
                                          { ns: 'common' },
                                        )}
                                      />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t(
                                      'printable_directories.save_source.location_conflict_warning',
                                      { ns: 'common' },
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}
                            {': '}
                            {formatQueryParamValue(value)}
                          </p>
                        ))
                      ) : (
                        <Typography
                          variant="paragraph"
                          size="sm"
                          textColor="secondary"
                        >
                          -
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
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
