import type { CollectionConfig } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportAccess,
  superAdminOrSupportOrTenantAccess,
} from '../Users/access/roles';
import { landingPagesEndpoints } from '../../endpoints/landingPages';
import { landingCopyFields } from './copyFields';

const REGION_ID = /^(state:[A-Z]{2}|county:\d{5}|place:\d{7})$/;

/**
 * One landing page: a topic in a region (state, county or city), in every
 * locale. Rows are created and retired by the generation job, never by hand
 * (docs/landing-pages.md); admins edit copy overrides and turn pages off.
 * Never deleted, so old addresses keep redirecting.
 */
export const LandingPages: CollectionConfig = {
  slug: 'landing-pages',
  dbName: 'lp_pages',
  labels: { singular: 'Landing page', plural: 'Landing pages' },
  access: {
    read: superAdminOrSupportOrTenantAccess,
    create: superAdminAccess,
    update: superAdminOrSupportOrTenantAccess,
    delete: superAdminAccess,
  },
  versions: { drafts: false, maxPerDoc: 50 },
  endpoints: landingPagesEndpoints,
  indexes: [{ fields: ['tenant', 'topic', 'regionId'], unique: true }],
  admin: {
    useAsTitle: 'label',
    group: 'Landing pages',
    defaultColumns: [
      'label',
      'regionType',
      'status',
      'resultCount',
      'countedAt',
    ],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Topic and place, for lists.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'topic',
          type: 'relationship',
          relationTo: 'landing-page-topics',
          required: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'live',
          index: true,
          options: [
            { label: 'Live', value: 'live' },
            { label: 'Off', value: 'off' },
            { label: 'Retired', value: 'retired' },
          ],
          access: {
            update: superAdminOrSupportAccess,
          },
          admin: {
            description:
              'Live: in Google and the sitemaps. Off: switched off by an admin. Retired: removed from the selection; its address redirects.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'regionId',
          type: 'text',
          required: true,
          index: true,
          validate: (value: string | null | undefined) =>
            (value && REGION_ID.test(value)) ||
            'A state, county or place Region id, e.g. county:53053.',
          admin: { readOnly: true },
        },
        {
          name: 'regionType',
          type: 'select',
          required: true,
          index: true,
          options: ['state', 'county', 'place'],
          admin: { readOnly: true },
        },
        {
          name: 'regionName',
          type: 'text',
          required: true,
          admin: { readOnly: true },
        },
        {
          name: 'regionState',
          type: 'text',
          required: true,
          index: true,
          admin: { readOnly: true },
        },
        {
          name: 'countyId',
          type: 'text',
          index: true,
          admin: {
            readOnly: true,
            condition: (data) => data?.regionType === 'place',
          },
        },
      ],
    },
    {
      name: 'placeSlug',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description:
          'The second part of the address, e.g. tacoma-wa. The same in every locale.',
      },
    },
    {
      name: 'redirect',
      type: 'group',
      access: {
        update: superAdminOrSupportAccess,
      },
      admin: {
        condition: (data) => data?.status !== 'live',
        description:
          'Where visitors and search engines go while this page is not live.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'page',
              type: 'relationship',
              relationTo: 'landing-pages',
              filterOptions: { status: { equals: 'live' } },
            },
            {
              name: 'path',
              type: 'text',
              validate: (value: string | null | undefined) =>
                !value ||
                (value.startsWith('/') && !value.startsWith('//')) ||
                'A path on this site, starting with /.',
              admin: {
                description: 'Used when no page is selected, e.g. /search?…',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'resultCount',
          type: 'number',
          admin: {
            readOnly: true,
            description: 'Results found by the last nightly count.',
          },
        },
        {
          name: 'countedAt',
          type: 'date',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'copy',
      type: 'group',
      admin: {
        description:
          'Overrides the topic and the Resource Directory templates for this page only.',
      },
      fields: landingCopyFields,
    },
  ],
};
