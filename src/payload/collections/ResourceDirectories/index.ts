import type { CollectionConfig } from 'payload';

import { setTenantIdAsId } from './hooks/setTenantIdAsId';
import { preventUpdateInDisabledLocale } from './hooks/preventUpdateInDisabledLocale';
import { revalidateCache } from './hooks/revalidateCache';
import { disableService } from './hooks/disableResourceDirectoryService';
import { brand } from './tabs/brand';
import { topics } from './tabs/topics';
import { suggestions } from './tabs/suggestions';
import { search } from './tabs/search';
import { common } from './tabs/common';
import { newLayout } from './tabs/newLayout';
import { header } from './tabs/header';
import { footer } from './tabs/footer';
import { featureFlags } from './tabs/featureFlags';
import { privacyPolicyPage } from './tabs/privacyPolicyPage';
import { termsOfUsePage } from './tabs/termsOfUsePage';
import { isSuperAdminAccess } from '../Users/access/roles';
import { hasThemeFieldAccess } from '../Users/access/permissions';
import { resource } from './tabs/resource';
import { accessibility } from './tabs/accessibility';

export const ResourceDirectories: CollectionConfig = {
  slug: 'resource-directories',
  // This avoid 63 character limit for some names
  dbName: 'rds',
  access: {
    create: isSuperAdminAccess,
    delete: isSuperAdminAccess,
  },
  labels: {
    singular: 'Settings',
    plural: 'Settings',
  },
  versions: {
    drafts: false,
  },
  admin: {
    useAsTitle: 'name',
    components: {
      views: {
        edit: {
          default: {
            Component:
              '@/payload/collections/ResourceDirectories/components/EditViewWrapper',
          },
        },
      },
    },
  },
  hooks: {
    beforeChange: [setTenantIdAsId, preventUpdateInDisabledLocale],
    afterChange: [revalidateCache],
    afterDelete: [revalidateCache, disableService],
  },
  fields: [
    {
      type: 'ui',
      name: 'Seed in Production',
      admin: {
        position: 'above',
        components: {
          Field: '@/payload/components/ProductionLinkButton',
        },
      },
    },
    {
      name: 'id',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          access: {
            update: hasThemeFieldAccess,
            create: hasThemeFieldAccess,
          },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        accessibility,
        common,
        brand,
        header,
        footer,
        suggestions,
        topics,
        resource,
        search,
        newLayout,
        privacyPolicyPage,
        termsOfUsePage,
        featureFlags,
      ],
    },
  ],
};
