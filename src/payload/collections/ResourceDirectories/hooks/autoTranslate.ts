import { CollectionAfterChangeHook } from 'payload';
import { get } from 'radash';
import {
  AUTO_TRANSLATED_STRING_PATHS,
  getChangedLocalizedPaths,
} from '@/payload/utilities/getChangedLocalizedPaths';
import { ResourceDirectory } from '@/payload/payload-types';
import { createLogger } from '@/lib/logger';

const log = createLogger('autoTranslate');

const extractItemId = (
  path: string,
  prefix: string,
  doc: ResourceDirectory,
): string | undefined => {
  const escapedPrefix = prefix.replace(/\./g, '\\.');
  const match = path.match(new RegExp(`^${escapedPrefix}\\.(\\d+)\\.`));
  if (!match) return undefined;

  const index = parseInt(match[1], 10);
  const item = get(doc, `${prefix}.${index}`);

  if (
    item &&
    typeof item === 'object' &&
    'id' in item &&
    typeof item.id === 'string'
  ) {
    return item.id;
  }
};

export const autoTranslate: CollectionAfterChangeHook<
  ResourceDirectory
> = async ({ doc, previousDoc, req, operation }) => {
  if (operation !== 'update') {
    return doc;
  }

  if (req.locale !== 'en') {
    return doc;
  }

  const { payload } = req;

  try {
    log.debug({ docId: doc.id }, 'autoTranslate hook triggered');

    const changedPaths = getChangedLocalizedPaths(previousDoc, doc);

    if (!changedPaths.length) {
      log.debug({ docId: doc.id }, 'No changes in localized fields; skipping');
      return doc;
    }

    const tenant = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

    if (!tenant) {
      log.warn({ docId: doc.id }, 'No tenant associated; skipping translation');
      return doc;
    }

    const tenantDoc = await payload.findByID({
      collection: 'tenants',
      id: tenant,
    });

    const targetLocales = (tenantDoc.enabledLocales || []).filter(
      (locale) => locale !== 'en',
    );

    if (targetLocales.length === 0) {
      log.info(
        { docId: doc.id, tenantId: tenant },
        'No target locales for translation; skipping',
      );
      return doc;
    }

    const changedItemIds = new Set<string>();

    changedPaths.forEach((path) => {
      if (AUTO_TRANSLATED_STRING_PATHS.includes(path)) {
        changedItemIds.add(path);
        return;
      }

      const flatPrefixes = [
        'suggestions',
        'badges.list',
        'search.facets',
      ] as const;

      for (const prefix of flatPrefixes) {
        const id = extractItemId(path, prefix, doc);
        if (id) {
          changedItemIds.add(id);
          return;
        }
      }

      const topicMatch = path.match(/^topics\.list\.(\d+)\./);
      if (topicMatch) {
        const subtopicMatch = path.match(
          /^topics\.list\.(\d+)\.subtopics\.(\d+)\./,
        );
        if (subtopicMatch) {
          const topicIndex = parseInt(subtopicMatch[1], 10);
          const subIndex = parseInt(subtopicMatch[2], 10);
          const item = get(
            doc,
            `topics.list.${topicIndex}.subtopics.${subIndex}`,
          );
          if (
            item &&
            typeof item === 'object' &&
            'id' in item &&
            typeof item.id === 'string'
          )
            changedItemIds.add(item.id);
        } else {
          const id = extractItemId(path, 'topics.list', doc);
          if (id) changedItemIds.add(id);
        }
      }
    });

    log.debug(
      {
        docId: doc.id,
        tenantId: tenant,
        targetLocales,
        changedPaths,
        changedItemIds: Array.from(changedItemIds),
      },
      'Queuing translation job',
    );

    const changedItemIdsArray = Array.from(changedItemIds).map((id) => ({
      id,
    }));

    const job = await payload.jobs.queue({
      task: 'translate',
      input: {
        tenantId: doc.id,
        locales: targetLocales.map((locale: string) => ({ locale })),
        engine: 'google',
        force: true,
        changedItemIds: changedItemIdsArray,
      },
      queue: 'translation',
    });

    log.info(
      {
        jobId: job.id,
        docId: doc.id,
        tenantId: tenant,
        localeCount: targetLocales.length,
        itemCount: changedItemIdsArray.length,
      },
      'Translation job queued',
    );
  } catch (error) {
    // Don't throw — translation failures should not block document saves
    log.error(
      { err: error, docId: doc.id },
      'Failed to queue translation job; document save continues',
    );
  }

  return doc;
};
