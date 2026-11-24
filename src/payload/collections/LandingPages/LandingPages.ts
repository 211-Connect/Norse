import type { CollectionConfig } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportAccess,
  superAdminOrSupportOrTenantAccess,
} from '../Users/access/roles';
import {
  MAX_SLUG_LENGTH,
  SLUG_PATTERN,
} from '@/app/(app)/features/landing-pages/lib/slugs';

import { landingPagesEndpoints } from '../../endpoints/landingPages';
import { landingCopyFields } from './copyFields';

const REGION_ID = /^(state:[A-Z]{2}|county:\d{5}|place:\d{7})$/;

const COMPONENTS = '@/payload/collections/LandingPages/components';

/**
 * Admins switch pages between live and off. Retiring and reviving follow the
 * selection and are done by the generation job only.
 */
const validateStatus = (
  value: string | null | undefined,
  { previousValue }: { previousValue?: string | null },
) => {
  if (!previousValue || value === previousValue) return true;
  if (previousValue === 'retired') {
    return 'A retired page comes back when its region and topic are selected again and Apply changes runs.';
  }
  if (value === 'retired') {
    return 'Pages are retired by removing their region or topic and running Apply changes. Use Off to hide one page.';
  }
  return true;
};

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
    // Pages come from the generation job only (SQL, no access check).
    create: () => false,
    update: superAdminOrSupportOrTenantAccess,
    delete: superAdminAccess,
  },
  versions: { drafts: false, maxPerDoc: 50 },
  endpoints: landingPagesEndpoints,
  indexes: [{ fields: ['tenant', 'topic', 'regionId'], unique: true }],
  admin: {
    pagination: { defaultLimit: 100, limits: [25, 50, 100, 200] },
    useAsTitle: 'label',
    group: 'Landing pages',
    listSearchableFields: ['label', 'regionName'],
    defaultColumns: [
      'label',
      'topic',
      'regionType',
      'status',
      'resultCount',
      'addresses',
    ],
    components: {
      beforeListTable: [`${COMPONENTS}/LandingPagesExport`],
    },
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
          validate: validateStatus,
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
          label: 'Level',
          type: 'select',
          required: true,
          index: true,
          options: [
            { label: 'State', value: 'state' },
            { label: 'County', value: 'county' },
            { label: 'City', value: 'place' },
          ],
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
      access: {
        update: superAdminOrSupportAccess,
      },
      validate: (value: string | null | undefined) =>
        (value &&
          SLUG_PATTERN.test(value) &&
          value.length <= MAX_SLUG_LENGTH) ||
        'Lowercase letters, digits and single hyphens, e.g. tacoma-wa.',
      admin: {
        description:
          'The second part of the address, e.g. tacoma-wa. The same in every locale. A change takes effect on Apply changes.',
        components: {
          afterInput: [`${COMPONENTS}/LandingPlaceSlugWarning`],
        },
      },
    },
    {
      name: 'addresses',
      type: 'ui',
      label: 'URL',
      admin: {
        components: {
          Cell: `${COMPONENTS}/LandingPageAddressesCell`,
          Field: `${COMPONENTS}/LandingPageAddressesField`,
        },
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
      fields: landingCopyFields('page'),
    },
  ],
};
