import type { TaskConfig } from 'payload';
import type { TranslationEngine } from '../services/translationService';
import { batchTranslate } from '../services/translationService';
import { retry } from 'radash';
import { assertValidLocale } from '../i18n/locales';
import { isEmpty } from '../utilities/isEmpty';

interface FieldToTranslate {
  path: string; // e.g., "backText", "list.0.name", "list.0.subtopics.1.name"
  value: string;
  locale: string;
}

const BATCH_SIZE_AZURE = 100;
const BATCH_SIZE_GOOGLE = 128;

export const translateTopics: TaskConfig<'translateTopics'> = {
  slug: 'translateTopics',
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

    console.log('[translateTopics] Handler started', {
      jobId: job.id,
      tenantId,
      locales,
      engine,
      force,
    });

    try {
      console.log('[translateTopics] Fetching resource directory:', tenantId);
      const resourceDirectory = await payload.findByID({
        collection: 'resource-directories',
        id: tenantId,
        locale: 'en',
      });

      if (!resourceDirectory) {
        console.error(
          '[translateTopics] Resource directory not found:',
          tenantId,
        );
        throw new Error(`Resource directory not found: ${tenantId}`);
      }

      console.log(
        '[translateTopics] Resource directory found, collecting fields...',
      );

      const fieldsToTranslate: FieldToTranslate[] = [];

      for (const localeString of locales) {
        assertValidLocale(localeString);

        const localizedDoc = await payload.findByID({
          collection: 'resource-directories',
          id: tenantId,
          locale: localeString,
        });

        if (
          resourceDirectory.topics?.backText &&
          (force || isEmpty(localizedDoc.topics?.backText))
        ) {
          fieldsToTranslate.push({
            path: 'topics.backText',
            value: resourceDirectory.topics.backText,
            locale: localeString,
          });
        }

        if (
          resourceDirectory.topics?.customHeading &&
          (force || isEmpty(localizedDoc.topics?.customHeading))
        ) {
          fieldsToTranslate.push({
            path: 'topics.customHeading',
            value: resourceDirectory.topics.customHeading,
            locale: localeString,
          });
        }

        if (
          resourceDirectory.topics?.list &&
          Array.isArray(resourceDirectory.topics.list)
        ) {
          resourceDirectory.topics.list.forEach((topic, topicIndex: number) => {
            if (topic?.name) {
              const localizedTopic = localizedDoc.topics?.list?.[topicIndex];
              if (force || isEmpty(localizedTopic?.name)) {
                fieldsToTranslate.push({
                  path: `topics.list.${topicIndex}.name`,
                  value: topic.name,
                  locale: localeString,
                });
              }
            }

            if (topic?.subtopics && Array.isArray(topic.subtopics)) {
              topic.subtopics.forEach((subtopic, subtopicIndex: number) => {
                if (subtopic?.name && subtopic?.queryType !== 'link') {
                  const localizedSubtopic =
                    localizedDoc.topics?.list?.[topicIndex]?.subtopics?.[
                      subtopicIndex
                    ];
                  if (force || isEmpty(localizedSubtopic?.name)) {
                    fieldsToTranslate.push({
                      path: `topics.list.${topicIndex}.subtopics.${subtopicIndex}.name`,
                      value: subtopic.name,
                      locale: localeString,
                    });
                  }
                }
              });
            }
          });
        }
      }

      const totalFields = fieldsToTranslate.length;

      console.log('[translateTopics] Fields collected:', {
        totalFields,
        fieldsBreakdown: fieldsToTranslate.reduce<Record<string, number>>(
          (acc, field) => {
            acc[field.locale] = (acc[field.locale] || 0) + 1;
            return acc;
          },
          {},
        ),
      });

      if (totalFields === 0) {
        console.log('[translateTopics] No fields to translate');
        return {
          output: {
            success: true,
            translated: 0,
          },
        };
      }

      const batchSize =
        engine === 'azure' ? BATCH_SIZE_AZURE : BATCH_SIZE_GOOGLE;
      let processedCount = 0;

      console.log('[translateTopics] Starting batch processing', {
        totalFields,
        batchSize,
        engine,
      });

      for (let i = 0; i < fieldsToTranslate.length; i += batchSize) {
        const batch = fieldsToTranslate.slice(i, i + batchSize);

        console.log(
          `[translateTopics] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(totalFields / batchSize)}`,
          {
            batchSize: batch.length,
            progress: `${i + batch.length}/${totalFields}`,
          },
        );

        const translations = await retry(
          {
            times: 5,
            delay: 1000,
            backoff: (attempt) => 1000 * Math.pow(2, attempt),
          },
          () =>
            batchTranslate(
              engine,
              batch.map((field) => ({
                text: field.value,
                targetLocale: field.locale,
              })),
            ),
        );

        const translationsByLocale: Record<string, Record<string, string>> = {};

        for (let j = 0; j < batch.length; j++) {
          const field = batch[j];
          const translation = translations[j];

          if (!translationsByLocale[field.locale]) {
            translationsByLocale[field.locale] = {};
          }

          translationsByLocale[field.locale][field.path] =
            translation.translatedText;
        }

        for (const [localeString, updates] of Object.entries(
          translationsByLocale,
        )) {
          assertValidLocale(localeString);

          const currentDoc = await payload.findByID({
            collection: 'resource-directories',
            id: tenantId,
            locale: localeString,
          });

          const updateData: Record<string, unknown> = {
            ...currentDoc,
          };

          for (const [path, value] of Object.entries(updates)) {
            const parts = path.split('.');
            let current: Record<string, unknown> = updateData;

            for (let k = 0; k < parts.length - 1; k++) {
              const part = parts[k];
              const isArray = !isNaN(Number(parts[k + 1]));

              if (isArray) {
                if (!Array.isArray(current[part])) {
                  current[part] = [];
                }
                current = current[part] as Record<string, unknown>;
              } else {
                if (!current[part]) {
                  current[part] = {};
                }
                current = current[part] as Record<string, unknown>;
              }
            }

            current[parts[parts.length - 1]] = value;
          }

          updateData._translationMeta = {
            lastTranslatedAt: new Date().toISOString(),
            translatedBy: 'auto',
            engine,
          };

          await payload.update({
            collection: 'resource-directories',
            id: tenantId,
            locale: localeString,
            data: updateData,
          });
        }

        processedCount += batch.length;
        console.log(
          `[translateTopics] Batch completed. Total processed: ${processedCount}/${totalFields}`,
        );
      }

      console.log('[translateTopics] Translation completed successfully', {
        totalTranslated: processedCount,
      });

      return {
        output: {
          success: true,
          translated: processedCount,
        },
      };
    } catch (error) {
      console.error('[translateTopics] Error during translation:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        jobId: job.id,
      });
      throw error;
    }
  },
};
