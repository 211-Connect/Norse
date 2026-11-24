import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionConfig,
  type TextFieldSingleValidation,
} from 'payload';

import { topicSlugProblem } from '@/app/(app)/features/landing-pages/lib/slugs';
import { createLogger } from '@/lib/logger';
import { defaultLocale } from '@/payload/i18n/locales';
import {
  LANDING_TOPIC_TRANSLATED_FIELDS,
  type LandingTopicField,
  autoTopicSlug,
} from '@/payload/jobs/translateLandingTopic';

import { superAdminOrSupportOrTenantAccess } from '../Users/access/roles';
import { landingCopyFields } from './copyFields';

const log = createLogger('landing-page-topics');

const tenantIdOf = (tenant: unknown): string | undefined =>
  typeof tenant === 'object' && tenant
    ? (tenant as { id: string }).id
    : (tenant as string | undefined);

/** Well formed, not reserved, and not another topic's slug in this locale. */
const validateTopicSlug: TextFieldSingleValidation = async (
  value,
  { data, id, req },
) => {
  if (!value) return true; // filled from the name, or the default locale's
  const problem = topicSlugProblem(value);
  if (problem) return problem;
  const tenant = tenantIdOf((data as { tenant?: unknown })?.tenant);
  if (!tenant) return true;
  const { docs } = await req.payload.find({
    collection: 'landing-page-topics',
    where: {
      and: [
        { tenant: { equals: tenant } },
        { slug: { equals: value } },
        ...(id ? [{ id: { not_equals: id } }] : []),
      ],
    },
    locale: req.locale ?? defaultLocale,
    limit: 1,
    depth: 0,
    req,
  });
  return docs.length
    ? `Another topic (${docs[0].name}) already uses "${value}" in this language.`
    : true;
};

/** The default-locale slug, from the name, when none was typed. */
const fillSlug: CollectionBeforeChangeHook = ({ data, req }) => {
  if ((req.locale ?? defaultLocale) !== defaultLocale) return data;
  if (!data.slug && data.name) data.slug = autoTopicSlug(data.name);
  return data;
};

const valueAt = (doc: unknown, field: string) =>
  field
    .split('.')
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      doc,
    );

/**
 * Translates the name and copy into the tenant's other locales whenever
 * they change in the default locale. Never blocks the save.
 */
const queueTranslation: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context?.skipLandingTopicTranslation) return doc;
  if ((req.locale ?? defaultLocale) !== defaultLocale) return doc;
  const fields = LANDING_TOPIC_TRANSLATED_FIELDS.filter((field) => {
    const value = valueAt(doc, field);
    if (!value) return false;
    return operation === 'create' || value !== valueAt(previousDoc, field);
  }) as LandingTopicField[];
  if (fields.length === 0) return doc;
  try {
    await req.payload.jobs.queue({
      task: 'translateLandingTopic',
      input: { topicId: doc.id, fields },
      queue: 'translation',
      req,
    });
  } catch (error) {
    log.error(
      { err: error, topicId: doc.id },
      'Failed to queue landing topic translation; save continues',
    );
  }
  return doc;
};

/**
 * Pages keep their topic for good (a retired page redirects to the topic's
 * search), so a topic with pages is turned off, not deleted.
 */
const refuseDeleteWithPages: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const { totalDocs } = await req.payload.count({
    collection: 'landing-pages',
    where: { topic: { equals: id } },
    req,
  });
  if (totalDocs > 0) {
    throw new APIError(
      `This topic has ${totalDocs} landing pages. Turn off "Generate pages" instead, then apply changes; its pages will redirect.`,
      400,
      undefined,
      true,
    );
  }
};

/**
 * A landing-page topic: its name and slug per locale, and a copy of the
 * search it runs, taken from a topic-card subtopic, a search suggestion or
 * written by hand. The copy keeps pages working when the source changes;
 * `source` lets the editor warn about it (docs/landing-pages.md).
 */
export const LandingPageTopics: CollectionConfig = {
  slug: 'landing-page-topics',
  dbName: 'lp_topics',
  labels: { singular: 'Landing page topic', plural: 'Landing page topics' },
  access: {
    read: superAdminOrSupportOrTenantAccess,
    create: superAdminOrSupportOrTenantAccess,
    update: superAdminOrSupportOrTenantAccess,
    delete: superAdminOrSupportOrTenantAccess,
  },
  versions: { drafts: false, maxPerDoc: 50 },
  hooks: {
    beforeChange: [fillSlug],
    afterChange: [queueTranslation],
    beforeDelete: [refuseDeleteWithPages],
  },
  admin: {
    useAsTitle: 'name',
    group: 'Landing pages',
    defaultColumns: [
      'name',
      'slug',
      'enabled',
      'search.queryType',
      'updatedAt',
    ],
  },
  fields: [
    {
      name: 'enabled',
      label: 'Generate pages',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          "Off: Apply changes retires this topic's pages, which then redirect to the equivalent search.",
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description:
              'What the topic is called on its pages, in the words people search with.',
          },
        },
        {
          name: 'slug',
          type: 'text',
          localized: true,
          index: true,
          validate: validateTopicSlug,
          admin: {
            description:
              'The first part of the page address, e.g. food-pantries in /food-pantries/tacoma-wa.',
          },
        },
      ],
    },
    {
      name: 'slugWarning',
      type: 'ui',
      admin: {
        components: {
          Field:
            '@/payload/collections/LandingPages/components/LandingTopicSlugWarning',
        },
      },
    },
    {
      name: 'sourceStatus',
      type: 'ui',
      admin: {
        components: {
          Field:
            '@/payload/collections/LandingPages/components/LandingTopicSourceField',
        },
      },
    },
    {
      name: 'search',
      type: 'group',
      admin: {
        description:
          'The search behind every page of this topic, copied from its source.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'queryType',
              type: 'select',
              required: true,
              defaultValue: 'taxonomy',
              options: [
                { label: 'Taxonomy codes', value: 'taxonomy' },
                { label: 'Text', value: 'text' },
              ],
            },
            {
              name: 'query',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Comma-separated taxonomy codes, or the text to search for.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'source',
      type: 'group',
      admin: {
        description: 'Where the search was copied from.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              required: true,
              defaultValue: 'custom',
              options: [
                { label: 'Topic card subtopic', value: 'subtopic' },
                { label: 'Search suggestion', value: 'suggestion' },
                { label: 'Custom query', value: 'custom' },
              ],
            },
            {
              name: 'ref',
              type: 'text',
              admin: {
                description:
                  'Id of the subtopic or suggestion in the Resource Directory.',
                condition: (_, sibling) => sibling?.kind !== 'custom',
              },
            },
            {
              name: 'label',
              type: 'text',
              admin: {
                description: 'Its name when the search was copied.',
                condition: (_, sibling) => sibling?.kind !== 'custom',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'copy',
      type: 'group',
      admin: {
        description:
          'Overrides the Resource Directory templates for every page of this topic. Leave empty to use the templates.',
      },
      fields: landingCopyFields('topic'),
    },
  ],
};
