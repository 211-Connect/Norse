import type { CollectionConfig } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportAccess,
} from '../Users/access/roles';

/**
 * Every landing-page URL ever issued, per locale. Exactly one row per
 * page and locale is `current`; the others redirect to it. Rows are written
 * by the generation job and never deleted (docs/landing-pages.md).
 */
export const LandingPageSlugs: CollectionConfig = {
  slug: 'landing-page-slugs',
  dbName: 'lp_slugs',
  labels: {
    singular: 'Landing page URL',
    plural: 'Landing page URLs',
  },
  access: {
    read: superAdminOrSupportAccess,
    create: superAdminAccess,
    update: superAdminAccess,
    delete: superAdminAccess,
  },
  indexes: [{ fields: ['tenant', 'locale', 'path'], unique: true }],
  admin: {
    // Internal: the page editor lists a page's URLs and old URLs.
    hidden: true,
    useAsTitle: 'path',
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
          admin: { description: 'topic-slug/region-slug' },
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
