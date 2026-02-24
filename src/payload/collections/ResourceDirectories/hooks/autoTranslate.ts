import { CollectionAfterChangeHook } from 'payload';
import { get } from 'radash';
import { getChangedLocalizedPaths } from '@/payload/utilities/getChangedLocalizedPaths';
import { ResourceDirectory } from '@/payload/payload-types';
import { createLogger } from '@/lib/logger';

const log = createLogger('autoTranslate');

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
      if (path === 'topics.backText' || path === 'topics.customHeading') {
        changedItemIds.add(path);
        return;
      }

      const suggestionMatch = path.match(/^suggestions\.(\d+)\./);
      if (suggestionMatch) {
        const index = parseInt(suggestionMatch[1], 10);
        const item = get(doc, `suggestions.${index}`);
        if (
          item &&
          typeof item === 'object' &&
          'id' in item &&
          typeof item.id === 'string'
        )
          changedItemIds.add(item.id);
        return;
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
          const index = parseInt(topicMatch[1], 10);
          const item = get(doc, `topics.list.${index}`);
          if (
            item &&
            typeof item === 'object' &&
            'id' in item &&
            typeof item.id === 'string'
          )
            changedItemIds.add(item.id);
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
