import type { CollectionConfig, TextFieldSingleValidation } from 'payload';

import { topicSlugProblem } from '@/app/(app)/features/landing-pages/lib/slugs';

import { superAdminOrSupportOrTenantAccess } from '../Users/access/roles';
import { landingCopyFields } from './copyFields';

const validateTopicSlug: TextFieldSingleValidation = (value) => {
  if (!value) return true; // filled by the translate job or the editor
  return topicSlugProblem(value) ?? true;
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
  admin: {
    useAsTitle: 'name',
    group: 'Landing pages',
    defaultColumns: ['name', 'slug', 'search.queryType', 'updatedAt'],
  },
  fields: [
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
      fields: landingCopyFields,
    },
  ],
};
