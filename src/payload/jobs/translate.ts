import { TaskConfig } from 'payload';
import {
  batchTranslate,
  TranslationEngine,
} from '../services/translationService';
import { retry } from 'radash';
import { assertValidLocale } from '../i18n/locales';
import { isEmpty } from '../utilities/isEmpty';
import { OrchestrationConfig, ResourceDirectory } from '../payload-types';
import { createLogger } from '@/lib/logger';

interface FieldToTranslate {
  path: string;
  value: string;
  locale: string;
  id?: string;
}

const BATCH_SIZE_AZURE = 100;
const BATCH_SIZE_GOOGLE = 128;

/**
 * Values containing {{ }} template syntax are dynamic (e.g. {{termName}}) and
 * should not be machine-translated because they reference run-time facet data.
 */
const CONTAINS_DYNAMIC_VALUE = /\{\{[^}]+\}\}/;

const SEARCH_TEXT_FIELDS = [
  'title',
  'queryInputPlaceholder',
  'locationInputPlaceholder',
  'viewDetailsText',
  'noResultsFallbackText',
] as const;

const CALLOUT_TEXT_FIELDS = ['description', 'title'] as const;

const HIGHLIGHT_TEXT_FIELDS = ['title', 'description', 'buttonText'] as const;

const log = createLogger('translate');

async function executeBatchTranslation(
  fields: FieldToTranslate[],
  engine: TranslationEngine,
): Promise<Record<string, string>> {
  const batchSize = engine === 'azure' ? BATCH_SIZE_AZURE : BATCH_SIZE_GOOGLE;
  const translationsByPath: Record<string, string> = {};

  for (let i = 0; i < fields.length; i += batchSize) {
    const batch = fields.slice(i, i + batchSize);
    const translations = await retry({ times: 3, delay: 1000 }, () =>
      batchTranslate(
        engine,
        batch.map((f) => ({
          id: f.path,
          text: f.value,
          targetLocale: f.locale,
        })),
      ),
    );
    translations.forEach((t) => {
      if (t?.id) translationsByPath[t.id] = t.translatedText;
    });
  }

  return translationsByPath;
}

function makeShouldTranslate(
  force: boolean | null | undefined,
  hasSpecificChanges: boolean,
  changedItemIds: Set<string | undefined>,
) {
  return (
    sourceValue: string | undefined | null,
    targetValue: string | undefined | null,
    itemId?: string | null,
  ): boolean => {
    if (isEmpty(sourceValue)) return false;
    if (force) return true;
    if (hasSpecificChanges) return itemId ? changedItemIds.has(itemId) : false;
    return isEmpty(targetValue);
  };
}

export const translate: TaskConfig<'translate'> = {
  slug: 'translate',
  inputSchema: [
    {
      name: 'tenantId',
      type: 'text',
      required: true,
    },
    {
      name: 'locales',
      type: 'array',
      required: true,
      fields: [
        {
          name: 'locale',
          type: 'text',
        },
      ],
    },
    {
      name: 'engine',
      type: 'select',
      required: true,
      options: ['azure', 'google'],
    },
    {
      name: 'force',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'changedItemIds',
      type: 'array',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
      ],
    },
  ],
  outputSchema: [
    {
      name: 'success',
      type: 'checkbox',
      required: true,
    },
    {
      name: 'translated',
      type: 'number',
      required: true,
    },
  ],
  handler: async ({ input, job, req }) => {
    const { payload } = req;
    const { tenantId, engine, force } = input;
    const locales = input.locales.map(({ locale }) => {
      assertValidLocale(locale);
      return locale;
    });

    const changedItemIds = new Set(
      input.changedItemIds?.map(({ id }) => id ?? undefined),
    );
    const hasSpecificChanges = changedItemIds.size > 0;

    log.info(
      { jobId: job.id, tenantId, locales, hasSpecificChanges },
      'Handler started',
    );

    const shouldTranslate = makeShouldTranslate(
      force,
      hasSpecificChanges,
      changedItemIds,
    );

    try {
      const englishResourceDirectory = await payload.findByID({
        collection: 'resource-directories',
        id: tenantId,
        locale: 'en',
      });

      if (!englishResourceDirectory) {
        throw new Error(`Resource directory not found: ${tenantId}`);
      }

      const totalTranslatedCounts: Record<string, number> = {};

      for (const targetLocale of locales) {
        if (targetLocale === 'en') continue;

        log.debug({ targetLocale, tenantId }, 'Processing locale');

        const targetDoc = await payload.findByID({
          collection: 'resource-directories',
          id: tenantId,
          locale: targetLocale,
        });

        const fieldsToTranslate: FieldToTranslate[] = [];

        const { topics: englishTopics, suggestions: englishSuggestions } =
          englishResourceDirectory;

        if (!englishTopics) {
          log.error(
            { tenantId, targetLocale },
            'No topics in English resource directory; skipping locale',
          );
          continue;
        }

        if (!englishSuggestions) {
          log.error(
            { tenantId, targetLocale },
            'No suggestions in English resource directory; skipping locale',
          );
          continue;
        }

        const targetTopics = targetDoc.topics || {};
        const getTargetTopic = (id: string) =>
          targetTopics.list?.find((t) => t.id === id);
        const getTargetSuggestion = (id: string) =>
          targetDoc.suggestions?.find((s) => s.id === id);

        // Topics Top Level
        if (
          shouldTranslate(
            englishTopics.backText,
            targetTopics.backText,
            'topics.backText',
          )
        ) {
          fieldsToTranslate.push({
            path: 'topics.backText',
            value: englishTopics.backText || '',
            locale: targetLocale,
          });
        }

        if (
          shouldTranslate(
            englishTopics.customHeading,
            targetTopics.customHeading,
            'topics.customHeading',
          )
        ) {
          fieldsToTranslate.push({
            path: 'topics.customHeading',
            value: englishTopics.customHeading || '',
            locale: targetLocale,
          });
        }

        // Topics List
        englishTopics.list?.forEach((sourceTopic, index) => {
          if (!sourceTopic.id) return;
          const targetTopic = getTargetTopic(sourceTopic.id);

          if (
            shouldTranslate(sourceTopic.name, targetTopic?.name, sourceTopic.id)
          ) {
            fieldsToTranslate.push({
              path: `topics.list.${index}.name`,
              value: sourceTopic.name,
              locale: targetLocale,
              id: sourceTopic.id,
            });
          }

          sourceTopic.subtopics?.forEach((sourceSubtopic, subIndex) => {
            if (!sourceSubtopic.id) return;

            const targetSubtopic = targetTopic?.subtopics?.find(
              (st) => st.id === sourceSubtopic.id,
            );

            if (
              shouldTranslate(
                sourceSubtopic.name,
                targetSubtopic?.name,
                sourceSubtopic.id,
              )
            ) {
              fieldsToTranslate.push({
                path: `topics.list.${index}.subtopics.${subIndex}.name`,
                value: sourceSubtopic.name,
                locale: targetLocale,
                id: sourceSubtopic.id,
              });
            }
          });
        });

        // Suggestions
        englishSuggestions?.forEach((sourceSuggestion, index) => {
          if (!sourceSuggestion.id) return;
          const targetSuggestion = getTargetSuggestion(sourceSuggestion.id);

          if (
            shouldTranslate(
              sourceSuggestion.value,
              targetSuggestion?.value,
              sourceSuggestion.id,
            )
          ) {
            fieldsToTranslate.push({
              path: `suggestions.${index}.value`,
              value: sourceSuggestion.value,
              locale: targetLocale,
              id: sourceSuggestion.id,
            });
          }
        });

        // Search Texts
        SEARCH_TEXT_FIELDS.forEach((field) => {
          const path = `search.texts.${field}`;
          const sourceValue = englishResourceDirectory.search?.texts?.[field];
          const targetValue = targetDoc.search?.texts?.[field];

          if (shouldTranslate(sourceValue, targetValue, path)) {
            fieldsToTranslate.push({
              path,
              value: sourceValue!,
              locale: targetLocale,
            });
          }
        });

        // Search Facets
        englishResourceDirectory.search?.facets?.forEach(
          (sourceFacet, index) => {
            if (!sourceFacet.id) return;
            const targetFacet = targetDoc.search?.facets?.find(
              (f) => f.id === sourceFacet.id,
            );

            if (
              shouldTranslate(
                sourceFacet.name,
                targetFacet?.name,
                sourceFacet.id,
              )
            ) {
              fieldsToTranslate.push({
                path: `search.facets.${index}.name`,
                value: sourceFacet.name!,
                locale: targetLocale,
                id: sourceFacet.id,
              });
            }
          },
        );

        // Badges
        englishResourceDirectory.badges?.list?.forEach((sourceBadge, index) => {
          if (!sourceBadge.id) return;
          const targetBadge = targetDoc.badges?.list?.find(
            (b) => b.id === sourceBadge.id,
          );

          (['badgeLabel', 'tooltip'] as const).forEach((field) => {
            const sourceValue = sourceBadge[field];
            const targetValue = targetBadge?.[field];

            // Skip dynamic template values (e.g. "{{termName}}")
            if (sourceValue && CONTAINS_DYNAMIC_VALUE.test(sourceValue)) return;

            if (shouldTranslate(sourceValue, targetValue, sourceBadge.id)) {
              fieldsToTranslate.push({
                path: `badges.list.${index}.${field}`,
                value: sourceValue!,
                locale: targetLocale,
                id: sourceBadge.id ?? undefined,
              });
            }
          });
        });

        // Alert (from common tab)
        englishResourceDirectory.common?.alert?.forEach(
          (sourceAlert, index) => {
            const targetAlert = targetDoc.common?.alert?.[index];

            if (
              shouldTranslate(
                sourceAlert.text,
                targetAlert?.text,
                `common.alert.${index}.text`,
              )
            ) {
              fieldsToTranslate.push({
                path: `common.alert.${index}.text`,
                value: sourceAlert.text!,
                locale: targetLocale,
              });
            }

            if (
              shouldTranslate(
                sourceAlert.buttonText,
                targetAlert?.buttonText,
                `common.alert.${index}.buttonText`,
              )
            ) {
              fieldsToTranslate.push({
                path: `common.alert.${index}.buttonText`,
                value: sourceAlert.buttonText!,
                locale: targetLocale,
              });
            }
          },
        );

        // Custom Data Providers Heading (from common tab)
        if (
          shouldTranslate(
            englishResourceDirectory.common?.customDataProvidersHeading,
            targetDoc.common?.customDataProvidersHeading,
            'common.customDataProvidersHeading',
          )
        ) {
          fieldsToTranslate.push({
            path: 'common.customDataProvidersHeading',
            value: englishResourceDirectory.common!.customDataProvidersHeading!,
            locale: targetLocale,
          });
        }

        // Data Providers (from common tab)
        englishResourceDirectory.common?.dataProviders?.forEach(
          (sourceProvider, index) => {
            const targetProvider = targetDoc.common?.dataProviders?.[index];

            if (
              shouldTranslate(
                sourceProvider.name,
                targetProvider?.name,
                `common.dataProviders.${index}.name`,
              )
            ) {
              fieldsToTranslate.push({
                path: `common.dataProviders.${index}.name`,
                value: sourceProvider.name!,
                locale: targetLocale,
              });
            }
          },
        );

        // Callouts (from newLayout tab)
        englishResourceDirectory.newLayout?.callouts?.options?.forEach(
          (sourceCallout, index) => {
            const targetCallout =
              targetDoc.newLayout?.callouts?.options?.[index];

            CALLOUT_TEXT_FIELDS.forEach((field) => {
              const sourceValue = sourceCallout[field];
              const targetValue = targetCallout?.[field];

              if (
                shouldTranslate(
                  sourceValue,
                  targetValue,
                  `newLayout.callouts.options.${index}.${field}`,
                )
              ) {
                fieldsToTranslate.push({
                  path: `newLayout.callouts.options.${index}.${field}`,
                  value: sourceValue!,
                  locale: targetLocale,
                });
              }
            });
          },
        );

        // Callouts Title (from newLayout tab)
        if (
          shouldTranslate(
            englishResourceDirectory.newLayout?.callouts?.title,
            targetDoc.newLayout?.callouts?.title,
            'newLayout.callouts.title',
          )
        ) {
          fieldsToTranslate.push({
            path: 'newLayout.callouts.title',
            value: englishResourceDirectory.newLayout!.callouts!.title!,
            locale: targetLocale,
          });
        }

        // Highlights Section Title
        if (
          shouldTranslate(
            englishResourceDirectory.highlights?.sectionTitle,
            targetDoc.highlights?.sectionTitle,
            'highlights.sectionTitle',
          )
        ) {
          fieldsToTranslate.push({
            path: 'highlights.sectionTitle',
            value: englishResourceDirectory.highlights!.sectionTitle!,
            locale: targetLocale,
          });
        }

        // Highlights Items
        englishResourceDirectory.highlights?.items?.forEach(
          (sourceHighlight, index) => {
            const targetHighlight = targetDoc.highlights?.items?.[index];

            HIGHLIGHT_TEXT_FIELDS.forEach((field) => {
              const sourceValue = sourceHighlight[field];
              const targetValue = targetHighlight?.[field];

              if (
                shouldTranslate(
                  sourceValue,
                  targetValue,
                  `highlights.items.${index}.${field}`,
                )
              ) {
                fieldsToTranslate.push({
                  path: `highlights.items.${index}.${field}`,
                  value: sourceValue!,
                  locale: targetLocale,
                });
              }
            });
          },
        );

        if (fieldsToTranslate.length === 0) {
          log.debug(
            { targetLocale, tenantId },
            'No fields to translate for locale; skipping',
          );
          continue;
        }

        log.info(
          { targetLocale, tenantId, fieldCount: fieldsToTranslate.length },
          'Translating fields',
        );

        const translationsByPath = await executeBatchTranslation(
          fieldsToTranslate,
          engine,
        );

        const updateData: Partial<ResourceDirectory> = {
          ...targetDoc,
          topics: {
            ...targetDoc.topics,
          },
        };

        if (translationsByPath['topics.backText']) {
          updateData.topics!.backText = translationsByPath['topics.backText'];
        } else if (isEmpty(targetDoc.topics?.backText)) {
          updateData.topics!.backText = englishTopics?.backText;
        }

        if (translationsByPath['topics.customHeading']) {
          updateData.topics!.customHeading =
            translationsByPath['topics.customHeading'];
        } else if (isEmpty(targetDoc.topics?.customHeading)) {
          updateData.topics!.customHeading = englishTopics?.customHeading;
        }

        // Reconstruct Lists ensuring structure matches Source
        if (englishTopics?.list) {
          const targetMap = new Map<
            string,
            NonNullable<
              NonNullable<ResourceDirectory['topics']>['list']
            >[number]
          >(targetDoc.topics?.list?.map((t) => [t.id!, t]) || []);

          updateData.topics!.list = englishTopics.list.map(
            (sourceItem, index) => {
              const targetItem = targetMap.get(sourceItem.id!);
              const newItem = {
                ...sourceItem,
                ...targetItem,
                id: sourceItem.id,
              };

              const namePath = `topics.list.${index}.name`;
              if (translationsByPath[namePath]) {
                newItem.name = translationsByPath[namePath];
              } else if (isEmpty(targetItem?.name)) {
                newItem.name = sourceItem.name;
              }

              if (sourceItem.subtopics) {
                const targetSubMap = new Map(
                  targetItem?.subtopics?.map((s) => [s.id!, s]) || [],
                );
                newItem.subtopics = sourceItem.subtopics.map(
                  (sourceSub, subIndex) => {
                    const targetSub = targetSubMap.get(sourceSub.id!);
                    const newSub = {
                      ...sourceSub,
                      ...(targetSub || {}),
                      id: sourceSub.id,
                    };

                    const subPath = `topics.list.${index}.subtopics.${subIndex}.name`;
                    if (translationsByPath[subPath]) {
                      newSub.name = translationsByPath[subPath];
                    } else if (isEmpty(targetSub?.name)) {
                      newSub.name = sourceSub.name;
                    }

                    return newSub;
                  },
                );
              } else {
                newItem.subtopics = [];
              }
              return newItem;
            },
          );
        }

        if (englishSuggestions) {
          const targetMap = new Map(
            targetDoc.suggestions?.map((s) => [s.id!, s]) || [],
          );
          updateData.suggestions = englishSuggestions.map(
            (sourceItem, index) => {
              const targetItem = targetMap.get(sourceItem.id!);
              const newItem = {
                ...sourceItem, // Start with source to get taxonomies etc
                ...(targetItem || {}), // Override with target values
                id: sourceItem.id, // Ensure ID mismatch doesn't happen
              };

              const path = `suggestions.${index}.value`;
              if (translationsByPath[path]) {
                newItem.value = translationsByPath[path];
              } else if (isEmpty(targetItem?.value)) {
                newItem.value = sourceItem.value;
              }
              return newItem;
            },
          );
        }

        // Search Texts
        updateData.search = {
          ...targetDoc.search,
          texts: { ...targetDoc.search?.texts },
        };

        SEARCH_TEXT_FIELDS.forEach((field) => {
          const path = `search.texts.${field}`;
          if (translationsByPath[path]) {
            updateData.search!.texts = {
              ...updateData.search!.texts,
              [field]: translationsByPath[path],
            };
          } else if (isEmpty(targetDoc.search?.texts?.[field])) {
            updateData.search!.texts = {
              ...updateData.search!.texts,
              [field]: englishResourceDirectory.search?.texts?.[field],
            };
          }
        });

        // Search Facets
        if (englishResourceDirectory.search?.facets) {
          const targetFacetMap = new Map(
            targetDoc.search?.facets?.map((f) => [f.id!, f]) || [],
          );
          updateData.search!.facets =
            englishResourceDirectory.search.facets.map((sourceFacet, index) => {
              const targetFacet = targetFacetMap.get(sourceFacet.id!);
              const newFacet = {
                ...sourceFacet,
                ...(targetFacet || {}),
                id: sourceFacet.id,
              };

              const path = `search.facets.${index}.name`;
              if (translationsByPath[path]) {
                newFacet.name = translationsByPath[path];
              } else if (isEmpty(targetFacet?.name)) {
                newFacet.name = sourceFacet.name;
              }
              return newFacet;
            });
        }

        // Badges
        if (englishResourceDirectory.badges?.list) {
          const targetBadgeMap = new Map(
            targetDoc.badges?.list?.map((b) => [b.id!, b]) || [],
          );
          updateData.badges = {
            ...targetDoc.badges,
            list: englishResourceDirectory.badges.list.map(
              (sourceBadge, index) => {
                const targetBadge = targetBadgeMap.get(sourceBadge.id!);
                const newBadge = {
                  ...sourceBadge,
                  ...(targetBadge || {}),
                  id: sourceBadge.id,
                };

                (['badgeLabel', 'tooltip'] as const).forEach((field) => {
                  const path = `badges.list.${index}.${field}`;
                  if (translationsByPath[path]) {
                    newBadge[field] = translationsByPath[path];
                  } else if (isEmpty(targetBadge?.[field])) {
                    // Only fall back to English if the source doesn't contain dynamic values
                    const sourceValue = sourceBadge[field];
                    if (
                      sourceValue &&
                      !CONTAINS_DYNAMIC_VALUE.test(sourceValue)
                    ) {
                      newBadge[field] = sourceValue;
                    }
                  }
                });

                return newBadge;
              },
            ),
          };
        }

        // Alert (from common tab)
        if (englishResourceDirectory.common?.alert) {
          updateData.common = {
            ...targetDoc.common,
            alert: englishResourceDirectory.common.alert.map(
              (sourceAlert, index) => {
                const targetAlert = targetDoc.common?.alert?.[index];
                const newAlert = {
                  ...sourceAlert,
                  ...(targetAlert || {}),
                };

                const textPath = `common.alert.${index}.text`;
                if (translationsByPath[textPath]) {
                  newAlert.text = translationsByPath[textPath];
                } else if (isEmpty(targetAlert?.text)) {
                  newAlert.text = sourceAlert.text;
                }

                const buttonTextPath = `common.alert.${index}.buttonText`;
                if (translationsByPath[buttonTextPath]) {
                  newAlert.buttonText = translationsByPath[buttonTextPath];
                } else if (isEmpty(targetAlert?.buttonText)) {
                  newAlert.buttonText = sourceAlert.buttonText;
                }

                return newAlert;
              },
            ),
          };
        }

        // Custom Data Providers Heading (from common tab)
        if (translationsByPath['common.customDataProvidersHeading']) {
          if (!updateData.common) updateData.common = { ...targetDoc.common };
          updateData.common.customDataProvidersHeading =
            translationsByPath['common.customDataProvidersHeading'];
        } else if (isEmpty(targetDoc.common?.customDataProvidersHeading)) {
          if (!updateData.common) updateData.common = { ...targetDoc.common };
          updateData.common.customDataProvidersHeading =
            englishResourceDirectory.common?.customDataProvidersHeading;
        }

        // Data Providers (from common tab)
        if (englishResourceDirectory.common?.dataProviders) {
          if (!updateData.common) updateData.common = { ...targetDoc.common };
          updateData.common.dataProviders =
            englishResourceDirectory.common.dataProviders.map(
              (sourceProvider, index) => {
                const targetProvider = targetDoc.common?.dataProviders?.[index];
                const newProvider = {
                  ...sourceProvider,
                  ...(targetProvider || {}),
                };

                const namePath = `common.dataProviders.${index}.name`;
                if (translationsByPath[namePath]) {
                  newProvider.name = translationsByPath[namePath];
                } else if (isEmpty(targetProvider?.name)) {
                  newProvider.name = sourceProvider.name;
                }

                return newProvider;
              },
            );
        }

        // Callouts (from newLayout tab)
        if (englishResourceDirectory.newLayout?.callouts) {
          updateData.newLayout = {
            ...targetDoc.newLayout,
            ...englishResourceDirectory.newLayout,
            callouts: {
              ...targetDoc.newLayout?.callouts,
              ...englishResourceDirectory.newLayout.callouts,
            },
          };

          if (englishResourceDirectory.newLayout.callouts.options) {
            updateData.newLayout!.callouts!.options =
              englishResourceDirectory.newLayout.callouts.options.map(
                (sourceCallout, index) => {
                  const targetCallout =
                    targetDoc.newLayout?.callouts?.options?.[index];
                  const newCallout = {
                    ...sourceCallout,
                    ...(targetCallout || {}),
                  };

                  CALLOUT_TEXT_FIELDS.forEach((field) => {
                    const path = `newLayout.callouts.options.${index}.${field}`;
                    if (translationsByPath[path]) {
                      newCallout[field] = translationsByPath[path];
                    } else if (isEmpty(targetCallout?.[field])) {
                      newCallout[field] = sourceCallout[field];
                    }
                  });

                  return newCallout;
                },
              );
          }

          const calloutsTitle = 'newLayout.callouts.title';
          if (translationsByPath[calloutsTitle]) {
            updateData.newLayout!.callouts!.title =
              translationsByPath[calloutsTitle];
          } else if (isEmpty(targetDoc.newLayout?.callouts?.title)) {
            updateData.newLayout!.callouts!.title =
              englishResourceDirectory.newLayout.callouts.title;
          }
        }

        // Highlights
        if (englishResourceDirectory.highlights) {
          updateData.highlights = {
            ...targetDoc.highlights,
            ...englishResourceDirectory.highlights,
          };

          // Highlights Section Title
          const sectionTitlePath = 'highlights.sectionTitle';
          if (translationsByPath[sectionTitlePath]) {
            updateData.highlights!.sectionTitle =
              translationsByPath[sectionTitlePath];
          } else if (isEmpty(targetDoc.highlights?.sectionTitle)) {
            updateData.highlights!.sectionTitle =
              englishResourceDirectory.highlights.sectionTitle;
          }

          // Highlights Items
          if (englishResourceDirectory.highlights.items) {
            updateData.highlights!.items =
              englishResourceDirectory.highlights.items.map(
                (sourceHighlight, index) => {
                  const targetHighlight = targetDoc.highlights?.items?.[index];
                  const newHighlight = {
                    ...sourceHighlight,
                    ...(targetHighlight || {}),
                  };

                  HIGHLIGHT_TEXT_FIELDS.forEach((field) => {
                    const path = `highlights.items.${index}.${field}`;
                    if (translationsByPath[path]) {
                      newHighlight[field] = translationsByPath[path];
                    } else if (isEmpty(targetHighlight?.[field])) {
                      const sourceValue = sourceHighlight[field];
                      if (sourceValue) {
                        newHighlight[field] = sourceValue;
                      }
                    }
                  });

                  return newHighlight;
                },
              );
          }
        }

        updateData._translationMeta = {
          lastTranslatedAt: new Date().toISOString(),
          translatedBy: 'auto',
          engine,
        };

        await payload.update({
          collection: 'resource-directories',
          id: tenantId,
          locale: targetLocale,
          data: updateData,
        });

        totalTranslatedCounts[targetLocale] = fieldsToTranslate.length;
      }

      log.info(
        {
          translated: Object.values(totalTranslatedCounts).reduce(
            (a, b) => a + b,
            0,
          ),
          tenantId,
          localeBreakdown: totalTranslatedCounts,
        },
        'Translation completed',
      );

      return {
        output: {
          success: true,
          translated: Object.values(totalTranslatedCounts).reduce(
            (a, b) => a + b,
            0,
          ),
        },
      };
    } catch (error) {
      log.error({ err: error, tenantId }, 'Translation handler failed');
      throw error;
    }
  },
};
