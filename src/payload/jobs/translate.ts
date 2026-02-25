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
  'noResultsFallbackText',
] as const;

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
