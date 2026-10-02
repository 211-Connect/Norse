import type { Payload } from 'payload';

import { createLogger } from '@/lib/logger';
import { assertValidLocale } from '@/payload/i18n/locales';
import type { ResourceDirectory, TenantMedia } from '@/payload/payload-types';
import type { TopicCache, TopicsCache } from '@/types/topicsCache';

const log = createLogger('buildTopicsCache');

function getMediaUrl(media?: TenantMedia | number | null): string | undefined {
  if (typeof media === 'number' || !media) {
    return undefined;
  }

  return media.url || undefined;
}

/**
 * Builds a multi-locale topics cache for a specific tenant
 * by fetching all enabled locales and merging their labels into a single structure.
 */
export async function buildTopicsCache(
  payload: Payload,
  tenantId: string,
  enabledLocales: string[],
  currentDoc: ResourceDirectory,
  currentLocale: string | undefined,
): Promise<TopicsCache | null> {
  const topicsMap = new Map<string, TopicCache>();
  let iconSize: TopicsCache['iconSize'] = 'small';
  let imageBorderRadius = 0;
  const backTexts: Record<string, string> = {};
  const customHeadings: Record<string, string> = {};
  let backText: string | undefined;
  let customHeading: string | undefined;

  for (const locale of enabledLocales) {
    assertValidLocale(locale);

    const resourceDirectory =
      locale === currentLocale && currentDoc
        ? currentDoc
        : await payload
            .find({
              collection: 'resource-directories',
              where: {
                tenant: {
                  equals: tenantId,
                },
              },
              locale,
              limit: 1,
            })
            .then((result) => result.docs[0] || null);

    if (!resourceDirectory) {
      log.warn(
        { tenantId, locale },
        'No resource directory found; skipping locale',
      );
      continue;
    }

    const topics = resourceDirectory.topics;

    if (!topics) {
      continue;
    }

    iconSize = topics.iconSize ?? iconSize;
    imageBorderRadius = topics.imageBorderRadius ?? imageBorderRadius;

    if (topics.backText) {
      backTexts[locale] = topics.backText;
      if (locale === 'en') {
        backText = topics.backText;
      }
    }

    if (topics.customHeading) {
      customHeadings[locale] = topics.customHeading;
      if (locale === 'en') {
        customHeading = topics.customHeading;
      }
    }

    const list = topics.list || [];

    list.forEach((topic, topicIndex) => {
      const topicKey = topic.id || `index:${topicIndex}`;

      if (!topicsMap.has(topicKey)) {
        topicsMap.set(topicKey, {
          id: topic.id ?? undefined,
          name: locale === 'en' ? topic.name : '',
          names: {},
          image: getMediaUrl(topic.image),
          href: topic.href ?? undefined,
          target: topic.openInNewTab ? '_blank' : undefined,
          subtopics: [],
        });
      }

      const topicCache = topicsMap.get(topicKey)!;
      topicCache.names[locale] = topic.name;

      if (locale === 'en') {
        topicCache.name = topic.name;
      }

      const subtopicsMap = new Map<string, TopicCache['subtopics'][number]>();

      topicCache.subtopics.forEach((subtopic) => {
        if (subtopic.id) {
          subtopicsMap.set(subtopic.id, subtopic);
        }
      });

      topic.subtopics?.forEach((subtopic, subtopicIndex) => {
        const subtopicKey = subtopic.id || `index:${subtopicIndex}`;

        if (!subtopicsMap.has(subtopicKey)) {
          subtopicsMap.set(subtopicKey, {
            id: subtopic.id ?? undefined,
            name: locale === 'en' ? subtopic.name : '',
            names: {},
            queryType: subtopic.queryType ?? undefined,
            query:
              subtopic.queryType !== 'link'
                ? (subtopic.query ?? undefined)
                : undefined,
            href:
              subtopic.queryType === 'link'
                ? (subtopic.href ?? undefined)
                : undefined,
            target: subtopic.openInNewTab ? '_blank' : undefined,
          });
        }

        const subtopicCache = subtopicsMap.get(subtopicKey)!;
        subtopicCache.names[locale] = subtopic.name;

        if (locale === 'en') {
          subtopicCache.name = subtopic.name;
        }
      });

      topicCache.subtopics = Array.from(subtopicsMap.values());
    });
  }

  if (topicsMap.size === 0) {
    return null;
  }

  return {
    tenantId,
    iconSize,
    imageBorderRadius,
    backText,
    backTexts,
    customHeading,
    customHeadings,
    list: Array.from(topicsMap.values()),
  };
}
