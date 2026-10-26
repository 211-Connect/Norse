'use client';

import { SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Autocomplete,
  AutocompleteOption,
  FLOATING_LISTBOX_CLASSNAME,
  keepDialogOpenWhileAutocompleteIsOpen,
} from '@/app/(app)/shared/components/ui/autocomplete';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(app)/shared/components/ui/select';
import { Typography } from '@/app/(app)/shared/components/ui/typography';
import { LocationSearchBar } from '@/app/(app)/shared/components/search/location-search-bar';
import { useSearchSuggestions } from '@/app/(app)/shared/hooks/api/use-search-suggestions';
import { useAppConfig } from '@/app/(app)/shared/hooks/use-app-config';
import { useDebounce } from '@/app/(app)/shared/hooks/use-debounce';
import { SEARCH_DEBOUNCE_DELAY } from '@/app/(app)/shared/lib/constants';
import { createPrintableDirectory } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectory';
import { createPrintableDirectorySection } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySection';
import { createPrintableDirectorySource } from '@/app/(app)/shared/serverActions/printableDirectories/createPrintableDirectorySource';
import { PrintableDirectoryResponseDto } from '@/lib/api/generated/data-contracts';
import { AccessPolicy } from '@/types/printableDirectories';

import {
  getAccessPolicyDescription,
  baseSlugFromName,
  getAccessPolicyLabel,
  isDirectoryNameValid,
  MIN_DIRECTORY_NAME_LENGTH,
  withUniqueSlugRetry,
} from '../utils';

const DEFAULT_ACCESS_POLICY: AccessPolicy = 'private';
/** Per suggestion group, like the main search dialog. */
const MAX_OPTIONS_PER_GROUP = 5;

type CreateDirectoryWizardProps = {
  open: boolean;
  locale: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (directory: PrintableDirectoryResponseDto) => void;
};

/**
 * 2-step directory creation modal. Step 1 asks for the name (and access
 * policy); step 2 for an optional query, which seeds one section with one
 * query source, and an optional default location for the directory.
 * Everything else is configured later — see docs/printable-directories.md
 * ("Creation wizard").
 */
export function CreateDirectoryWizard({
  open,
  locale,
  onOpenChange,
  onCreated,
}: CreateDirectoryWizardProps) {
  const { t } = useTranslation(['page-directories', 'common']);
  const appConfig = useAppConfig();

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  // Shown once something is typed; an empty name just disables Next.
  const nameTooShort = name.trim().length > 0 && !isDirectoryNameValid(name);
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy>(
    DEFAULT_ACCESS_POLICY,
  );
  const [topicSearchTerm, setTopicSearchTerm] = useState('');
  const [topicOption, setTopicOption] = useState<AutocompleteOption | null>(
    null,
  );
  const [locationName, setLocationName] = useState('');
  const [coordinates, setCoordinates] = useState<number[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedTopicSearchTerm = useDebounce(
    topicSearchTerm,
    SEARCH_DEBOUNCE_DELAY,
  );
  const { taxonomies: taxonomiesDisplay, isFetching: isFetchingTopics } =
    useSearchSuggestions(debouncedTopicSearchTerm);
  const isLoadingTopics =
    topicSearchTerm.trim().length > 0 &&
    !topicOption &&
    (topicSearchTerm !== debouncedTopicSearchTerm || isFetchingTopics);

  const hideAccessPolicy =
    appConfig.printableDirectories.accessMode === 'everyone';

  const topicOptions = useMemo((): AutocompleteOption[] => {
    const normalizedSearchTerm = topicSearchTerm.trim().toLowerCase();
    const suggestionsGroup = t('search.suggestions', { ns: 'common' });
    const categoriesGroup = t('search.categories', { ns: 'common' });
    const taxonomiesGroup = t('search.taxonomies', { ns: 'common' });

    const suggestions: AutocompleteOption[] = appConfig.suggestions.map(
      (option) => ({
        Icon: SearchIcon,
        value: option.value,
        query: option.taxonomies,
        queryType: 'taxonomy',
        group: suggestionsGroup,
      }),
    );

    if (!normalizedSearchTerm) {
      return suggestions.slice(0, MAX_OPTIONS_PER_GROUP);
    }

    const matchesTerm = (option: AutocompleteOption) =>
      option.value.toLowerCase().includes(normalizedSearchTerm);

    const topicList: AutocompleteOption[] = appConfig.topics.list.flatMap(
      (topic) =>
        topic.subtopics
          .filter((subtopic) => subtopic.queryType !== 'link')
          .map((subtopic) => ({
            Icon: SearchIcon,
            value: subtopic.name,
            query: subtopic.query,
            queryType: subtopic.queryType || 'text',
            group: categoriesGroup,
          })),
    );

    const taxonomyList: AutocompleteOption[] = taxonomiesDisplay.map(
      (option) => ({
        value: option.name,
        query: option.code,
        queryType: 'taxonomy',
        group: taxonomiesGroup,
      }),
    );

    // Taxonomies already come matched by the API (by name, code, ...), so
    // only the locally listed groups are filtered here.
    return [
      ...suggestions.filter(matchesTerm).slice(0, MAX_OPTIONS_PER_GROUP),
      ...topicList.filter(matchesTerm).slice(0, MAX_OPTIONS_PER_GROUP),
      ...taxonomyList.slice(0, MAX_OPTIONS_PER_GROUP),
    ];
  }, [
    appConfig.suggestions,
    appConfig.topics,
    taxonomiesDisplay,
    topicSearchTerm,
    t,
  ]);

  const reset = () => {
    setStep(1);
    setName('');
    setAccessPolicy(DEFAULT_ACCESS_POLICY);
    setTopicSearchTerm('');
    setTopicOption(null);
    setLocationName('');
    setCoordinates(null);
    setError(null);
  };

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleCommitTopic = (value: string, option?: AutocompleteOption) => {
    setTopicSearchTerm(value);
    setTopicOption(option ?? null);
  };

  const handleClearTopic = () => {
    setTopicOption(null);
    setTopicSearchTerm('');
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const trimmedName = name.trim();
      // Clearing the location field leaves "Everywhere": that's no default
      // location rather than a place called "Everywhere".
      const everywhereLabel = t('search.everywhere', {
        ns: 'common',
        defaultValue: 'Everywhere',
      });
      const trimmedLocation =
        locationName.trim() === everywhereLabel ? '' : locationName.trim();
      // Text typed without picking a suggestion is still a valid search.
      const typedTopic = topicSearchTerm.trim();
      const topic: AutocompleteOption | null =
        topicOption ??
        (typedTopic
          ? { value: typedTopic, query: typedTopic, queryType: 'text' }
          : null);

      // The location is the directory's default location, which every
      // query source without its own location uses. Coordinates from the
      // location field are [longitude, latitude].
      const defaultQueryConfig = trimmedLocation
        ? {
            locationName: trimmedLocation,
            coords: coordinates
              ? { latitude: coordinates[1], longitude: coordinates[0] }
              : undefined,
          }
        : undefined;

      // Cover title, header and footer defaults are applied by the server
      // action itself.
      const createResult = await withUniqueSlugRetry(
        baseSlugFromName(name),
        (slug) =>
          createPrintableDirectory(
            {
              name: trimmedName,
              slug,
              primaryLanguage: locale,
              defaultQueryConfig,
              ...(hideAccessPolicy ? {} : { accessPolicy }),
            },
            appConfig.tenantId,
          ),
      );

      if (!createResult.success) {
        setError(t('unable_to_create_directory', { ns: 'page-directories' }));
        return;
      }

      let directory = createResult.data;

      if (topic?.query) {
        const sectionResult = await createPrintableDirectorySection(
          directory.id,
          {
            headingLocalized: {
              values: {
                [locale]: topic.value,
              },
            },
            descriptionLocalized: { values: {} },
          },
          appConfig.tenantId,
        );

        // The API appends new sections last.
        const newestSection = sectionResult?.sections.reduce<
          (typeof sectionResult.sections)[number] | undefined
        >(
          (latest, section) =>
            !latest || section.order > latest.order ? section : latest,
          undefined,
        );

        if (sectionResult && newestSection) {
          directory = sectionResult;

          const sourceResult = await createPrintableDirectorySource({
            directoryId: directory.id,
            sectionId: newestSection.id,
            payload: {
              type: 'query',
              query: {
                title: topic.value,
                params: {
                  query: topic.query,
                  query_type: topic.queryType,
                },
              },
            },
            tenantId: appConfig.tenantId,
          });

          if (sourceResult) {
            directory = sourceResult;
          }
        }

        // The directory exists either way and the rest can be added from its
        // page; say so instead of failing silently.
        if (!sectionResult || !newestSection) {
          toast.error(
            t('unable_to_create_section', { ns: 'page-directories' }),
          );
        } else if (
          directory.sections.every((section) => section.sources.length === 0)
        ) {
          toast.error(t('unable_to_add_source', { ns: 'page-directories' }));
        }
      }

      onCreated(directory);
      handleOpenChange(false);
    } catch {
      setError(t('unable_to_create_directory', { ns: 'page-directories' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* overflow-visible: the suggestion lists may extend past the
          dialog's bottom edge instead of being clipped by it. */}
      <DialogContent
        className="overflow-visible"
        onEscapeKeyDown={keepDialogOpenWhileAutocompleteIsOpen}
      >
        <DialogHeader>
          <DialogTitle>
            {t('wizard_title', { ns: 'page-directories' })}
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <>
            <Typography
              as="p"
              variant="paragraph"
              size="sm"
              className="text-muted-foreground"
            >
              {t('wizard_step_label', {
                ns: 'page-directories',
                current: 1,
                total: 2,
              })}
              {' — '}
              {t('wizard_step1_title', { ns: 'page-directories' })}
            </Typography>

            <div className="space-y-2">
              <Label htmlFor="wizard-directory-name">
                {t('name_label', { ns: 'page-directories' })}
              </Label>
              <Input
                id="wizard-directory-name"
                autoFocus
                className="h-9 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={nameTooShort}
                aria-describedby={
                  nameTooShort ? 'wizard-directory-name-error' : undefined
                }
              />
              {nameTooShort && (
                <p
                  id="wizard-directory-name-error"
                  className="text-destructive text-xs"
                >
                  {t('name_too_short', {
                    ns: 'page-directories',
                    min: MIN_DIRECTORY_NAME_LENGTH,
                  })}
                </p>
              )}
            </div>

            {!hideAccessPolicy && (
              <div className="space-y-2">
                <Label htmlFor="wizard-access-policy">
                  {t('access_policy.label', { ns: 'page-directories' })}
                </Label>
                <Select
                  value={accessPolicy}
                  onValueChange={(value) =>
                    setAccessPolicy(value as AccessPolicy)
                  }
                >
                  <SelectTrigger id="wizard-access-policy" className="h-9">
                    <SelectValue
                      placeholder={t('access_policy.label', {
                        ns: 'page-directories',
                      })}
                    >
                      {getAccessPolicyLabel(accessPolicy, t)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(['private', 'shared-read', 'shared-edit'] as const).map(
                      (policy) => (
                        <SelectItem
                          key={policy}
                          value={policy}
                          className="group"
                        >
                          <div className="flex flex-col py-0.5">
                            <span>{getAccessPolicyLabel(policy, t)}</span>
                            <span className="text-muted-foreground group-data-[highlighted]:text-primary-foreground/80 text-xs">
                              {getAccessPolicyDescription(policy, t)}
                            </span>
                          </div>
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {t('call_to_action.cancel', { ns: 'common' })}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!isDirectoryNameValid(name)}
              >
                {t('wizard_next', { ns: 'page-directories' })}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Typography
              as="p"
              variant="paragraph"
              size="sm"
              className="text-muted-foreground"
            >
              {t('wizard_step_label', {
                ns: 'page-directories',
                current: 2,
                total: 2,
              })}
              {' — '}
              {t('wizard_step2_title', { ns: 'page-directories' })}
            </Typography>
            <Typography as="p" variant="paragraph" size="sm">
              {t('wizard_step2_description', { ns: 'page-directories' })}
            </Typography>

            <div className="space-y-4">
              <div className="space-y-2">
                {/* The Autocomplete names the input itself (`readerLabel`). */}
                <Label htmlFor="wizard-query" aria-hidden="true">
                  {t('wizard_query_label', { ns: 'page-directories' })}
                </Label>
                <Autocomplete
                  wrapperTestId="wizard-query-field"
                  readerLabel={t('wizard_query_label', {
                    ns: 'page-directories',
                  })}
                  inputProps={{
                    id: 'wizard-query',
                    className: 'h-9 text-sm',
                    placeholder: t('wizard_query_placeholder', {
                      ns: 'page-directories',
                    }),
                  }}
                  Icon={SearchIcon}
                  options={topicOptions}
                  value={topicSearchTerm}
                  onInputChange={(value) => {
                    setTopicOption(null);
                    setTopicSearchTerm(value);
                  }}
                  onCommit={handleCommitTopic}
                  onClear={handleClearTopic}
                  loading={isLoadingTopics}
                  listboxClassName={FLOATING_LISTBOX_CLASSNAME}
                  clearButtonLabel={t('call_to_action.remove', {
                    ns: 'common',
                  })}
                />
                <p className="text-muted-foreground text-xs">
                  {t('wizard_query_help', { ns: 'page-directories' })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wizard-location">
                  {t('wizard_location_label', { ns: 'page-directories' })}
                </Label>
                <LocationSearchBar
                  mode="standalone"
                  inputId="wizard-location"
                  showIcon={false}
                  placeholder=""
                  initialValue={locationName}
                  onLocationChange={(location, nextCoordinates) => {
                    setLocationName(location);
                    setCoordinates(nextCoordinates);
                  }}
                />
                <p className="text-muted-foreground text-xs">
                  {t('wizard_location_help', { ns: 'page-directories' })}
                </p>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-xs" role="alert">
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                {t('wizard_back', { ns: 'page-directories' })}
              </Button>
              <Button onClick={handleCreate} loading={isSubmitting}>
                {isSubmitting
                  ? t('wizard_creating', { ns: 'page-directories' })
                  : t('wizard_create', { ns: 'page-directories' })}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
