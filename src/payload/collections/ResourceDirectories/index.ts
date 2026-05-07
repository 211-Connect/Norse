import type { CollectionConfig } from 'payload';

import { setTenantIdAsId } from './hooks/setTenantIdAsId';
import { preventUpdateInDisabledLocale } from './hooks/preventUpdateInDisabledLocale';
import { revalidateCache } from './hooks/revalidateCache';
import { disableService } from './hooks/disableResourceDirectoryService';
import { autoTranslate } from './hooks/autoTranslate';
import { pushFacetsToCache } from './hooks/pushFacetsToCache';
import { invalidateApiCache } from './hooks/invalidateApiCache';
import { syncKeycloakRealmBrandingAfterChange } from './hooks/syncKeycloakBrandingAfterChange';
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
import { highlights } from './tabs/highlights';
import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../Users/access/roles';
import { resource } from './tabs/resource';
import { accessibility } from './tabs/accessibility';
import { badges } from './tabs/badges';

export const ResourceDirectories: CollectionConfig = {
  slug: 'resource-directories',
  // This avoid 63 character limit for some names
  dbName: 'rds',
  access: {
    create: superAdminAccess,
    delete: superAdminAccess,
  },
  labels: {
    singular: 'Settings',
    plural: 'Settings',
  },
  versions: {
    drafts: false,
    maxPerDoc: 0,
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
    afterChange: [
      revalidateCache,
      autoTranslate,
      pushFacetsToCache,
      syncKeycloakRealmBrandingAfterChange,
      invalidateApiCache,
    ],
    afterDelete: [revalidateCache, disableService],
  },
  fields: [
    {
      type: 'ui',
      name: 'cachingAlert',
      admin: {
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/CachingAlert',
        },
      },
    },
    {
      type: 'ui',
      name: 'actionButtons',
      admin: {
        position: 'above',
        components: {
          Field:
            '@/payload/collections/ResourceDirectories/components/ResourceDirectoryActions',
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
            update: superAdminOrSupportOrTenantAccess,
            create: superAdminOrSupportOrTenantAccess,
          },
        },
      ],
    },
    {
      name: '_translationMeta',
      type: 'group',
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'lastTranslatedAt',
          type: 'date',
        },
        {
          name: 'translatedBy',
          type: 'select',
          options: ['auto', 'manual'],
        },
        {
          name: 'engine',
          type: 'select',
          options: ['azure', 'google'],
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
        highlights,
        badges,
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
