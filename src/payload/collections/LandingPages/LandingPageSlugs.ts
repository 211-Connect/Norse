import type { CollectionConfig } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportAccess,
} from '../Users/access/roles';

/**
 * Every landing-page address ever issued, per locale. Exactly one row per
 * page and locale is `current`; the others redirect to it. Rows are written
 * by the generation job and never deleted (docs/landing-pages.md).
 */
export const LandingPageSlugs: CollectionConfig = {
  slug: 'landing-page-slugs',
  dbName: 'lp_slugs',
  labels: {
    singular: 'Landing page address',
    plural: 'Landing page addresses',
  },
  access: {
    read: superAdminOrSupportAccess,
    create: superAdminAccess,
    update: superAdminAccess,
    delete: superAdminAccess,
  },
  indexes: [{ fields: ['tenant', 'locale', 'path'], unique: true }],
  admin: {
    useAsTitle: 'path',
    group: 'Landing pages',
    defaultColumns: ['path', 'locale', 'current', 'page', 'updatedAt'],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'locale', type: 'text', required: true, index: true },
        {
          name: 'path',
          type: 'text',
          required: true,
          index: true,
          admin: { description: 'topic-slug/place-slug' },
        },
        { name: 'current', type: 'checkbox', defaultValue: true, index: true },
      ],
    },
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'landing-pages',
      required: true,
      index: true,
    },
  ],
};
