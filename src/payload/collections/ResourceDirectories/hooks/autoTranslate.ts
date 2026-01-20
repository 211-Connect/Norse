import { CollectionAfterChangeHook } from 'payload';
import { get } from 'radash';
import { getChangedLocalizedPaths } from '@/payload/utilities/getChangedLocalizedPaths';
import { ResourceDirectory } from '@/payload/payload-types';

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
    console.log('[autoTranslate] ========================================');
    console.log('[autoTranslate] Resource Directory ID:', doc.id);

    const changedPaths = getChangedLocalizedPaths(previousDoc, doc);
    console.log('[autoTranslate] Changed paths:', changedPaths);

    if (!changedPaths.length) {
      console.log('[autoTranslate] No changes detected in localized fields');
      console.log('[autoTranslate] ========================================');
      return doc;
    }

    const tenant = typeof doc.tenant === 'string' ? doc.tenant : doc.tenant?.id;

    if (!tenant) {
      console.log('[autoTranslate] No tenant associated with document');
      console.log('[autoTranslate] ========================================');
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
      console.log('[autoTranslate] No target locales enabled for translation');
      console.log('[autoTranslate] ========================================');
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

    console.log('[autoTranslate] Target locales:', targetLocales);
    console.log('[autoTranslate] Changed Paths:', changedPaths);
    console.log(
      '[autoTranslate] Changed Item IDs:',
      Array.from(changedItemIds),
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

    console.log('[autoTranslate] Translation job queued:', `Job ${job.id}`);
    console.log('[autoTranslate] Will translate items:', changedItemIdsArray);
    console.log('[autoTranslate] ========================================');
  } catch (error) {
    // Log error but don't throw - translation failures shouldn't block saves
    console.error('[autoTranslate] ===== ERROR =====');
    console.error('[autoTranslate] Failed to queue translation job:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      documentId: doc.id,
    });
    console.error(
      '[autoTranslate] Document save will proceed despite translation error',
    );
    console.error('[autoTranslate] ====================');
  }

  return doc;
};
