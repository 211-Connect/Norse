import type { JSONFieldValidation, Tab } from 'payload';

import { landingCopyFields } from '../../LandingPages/copyFields';
import { superAdminOrSupportOrTenantAccess } from '../../Users/access/roles';

const REGION_ID = /^(state:[A-Z]{2}|county:\d{5}|place:\d{7})$/;

/** The stored selection must be a list of regions the planner can read. */
const validateRegions: JSONFieldValidation = (value) => {
  if (value === null || value === undefined) return true;
  if (!Array.isArray(value)) return 'Regions must be a list.';
  for (const region of value as Record<string, unknown>[]) {
    if (
      typeof region?.id !== 'string' ||
      !REGION_ID.test(region.id) ||
      !['state', 'county', 'place'].includes(region.type as string) ||
      typeof region.name !== 'string' ||
      typeof region.state !== 'string'
    ) {
      return `Invalid region: ${JSON.stringify(region)}`;
    }
  }
  return true;
};

/**
 * SEO landing pages for this Resource Directory (docs/landing-pages.md).
 * Hidden until `featureFlags.enableLandingPages` is on. Saving never changes
 * pages; the generation job does, on Apply changes.
 */
export const landingPages: Tab = {
  name: 'landingPages',
  label: 'Landing Pages',
  admin: {
    condition: (data) => Boolean(data?.featureFlags?.enableLandingPages),
  },
  fields: [
    {
      name: 'landingSummary',
      type: 'ui',
      admin: {
        condition: (data) => Boolean(data?.featureFlags?.enableLandingPages),
        components: {
          Field:
            '@/payload/collections/LandingPages/components/LandingSummaryCard',
        },
      },
    },
    {
      name: 'regions',
      type: 'json',
      validate: validateRegions,
      access: {
        create: superAdminOrSupportOrTenantAccess,
        update: superAdminOrSupportOrTenantAccess,
      },
      admin: {
        condition: (data) => Boolean(data?.featureFlags?.enableLandingPages),
        components: {
          Field:
            '@/payload/collections/LandingPages/components/RegionPickerField',
        },
      },
    },
    {
      name: 'landingTopics',
      type: 'ui',
      admin: {
        condition: (data) => Boolean(data?.featureFlags?.enableLandingPages),
        components: {
          Field:
            '@/payload/collections/LandingPages/components/LandingTopicsField',
        },
      },
    },
    {
      name: 'templates',
      type: 'group',
      label: 'Page copy',
      admin: {
        condition: (data) => Boolean(data?.featureFlags?.enableLandingPages),
        description:
          'Used by every page unless its topic sets its own. Variables: {topic}, {location}, {state}, {name}, {phone}, {email}. Empty fields use the built-in text for the language. Other languages are translated automatically from English.',
      },
      fields: landingCopyFields('template'),
    },
  ],
};
