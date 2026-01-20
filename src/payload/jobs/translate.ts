import { TaskConfig } from 'payload';
import { batchTranslate } from '../services/translationService';
import { retry } from 'radash';
import { assertValidLocale } from '../i18n/locales';
import { isEmpty } from '../utilities/isEmpty';
import { ResourceDirectory } from '../payload-types';

interface TranslateInput {
  tenantId: string;
  locales: { locale: string }[];
  engine: 'azure' | 'google';
  force: boolean;
  changedItemIds?: { id: string }[];
}

interface FieldToTranslate {
  path: string;
  value: string;
  locale: string;
  id?: string;
}

const BATCH_SIZE_AZURE = 100;
const BATCH_SIZE_GOOGLE = 128;

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

    const changedItemIds = new Set(input.changedItemIds?.map(({ id }) => id));
    const hasSpecificChanges = changedItemIds.size > 0;

    console.log('[translate] Handler started', {
      jobId: job.id,
      tenantId,
      locales,
      hasSpecificChanges,
    });

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

        console.log(`[translate] Processing locale: ${targetLocale}`);

        const targetDoc = await payload.findByID({
          collection: 'resource-directories',
          id: tenantId,
          locale: targetLocale,
        });

        const fieldsToTranslate: FieldToTranslate[] = [];

        const shouldTranslate = (
          sourceValue: string | undefined | null,
          targetValue: string | undefined | null,
          itemId?: string | null,
        ): boolean => {
          if (isEmpty(sourceValue)) return false;

          if (force) {
            return true;
          }

          if (hasSpecificChanges) {
            return itemId ? changedItemIds.has(itemId) : false;
          }

          return isEmpty(targetValue);
        };

        const { topics: englishTopics, suggestions: englishSuggestions } =
          englishResourceDirectory;

        if (!englishTopics) {
          console.error(
            '[translate] No topics found in English resource directory',
          );
          continue;
        }

        if (!englishSuggestions) {
          console.error(
            '[translate] No suggestions found in English resource directory',
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

        if (fieldsToTranslate.length === 0) {
          console.log(`[translate] No fields to translate for ${targetLocale}`);
          continue;
        }

        console.log(
          `[translate] Translating ${fieldsToTranslate.length} fields for ${targetLocale}`,
        );

        const batchSize =
          engine === 'azure' ? BATCH_SIZE_AZURE : BATCH_SIZE_GOOGLE;
        const translationsByPath: Record<string, string> = {};

        for (let i = 0; i < fieldsToTranslate.length; i += batchSize) {
          const batch = fieldsToTranslate.slice(i, i + batchSize);

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

          translations.forEach((translation) => {
            if (translation && translation.id) {
              translationsByPath[translation.id] = translation.translatedText;
            }
          });
        }

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

      console.log('[translate] Completed successfully');

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
      console.error('[translate] Error:', error);
      throw error;
    }
  },
};
