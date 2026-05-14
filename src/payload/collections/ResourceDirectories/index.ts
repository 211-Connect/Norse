import type { CollectionConfig } from 'payload';

import {
  superAdminAccess,
  superAdminOrSupportOrTenantAccess,
} from '../Users/access/roles';
import { autoTranslate } from './hooks/autoTranslate';
import { disableService } from './hooks/disableResourceDirectoryService';
import { invalidateApiCache } from './hooks/invalidateApiCache';
import { preventUpdateInDisabledLocale } from './hooks/preventUpdateInDisabledLocale';
import { pushFacetsToCacheAfterChangeHook } from './hooks/pushFacetsToCache';
import { revalidateCache } from './hooks/revalidateCache';
import { setTenantIdAsId } from './hooks/setTenantIdAsId';
import { syncKeycloakRealmBrandingAfterChange } from './hooks/syncKeycloakBrandingAfterChange';
import { accessibility } from './tabs/accessibility';
import { badges } from './tabs/badges';
import { brand } from './tabs/brand';
import { common } from './tabs/common';
import { featureFlags } from './tabs/featureFlags';
import { footer } from './tabs/footer';
import { header } from './tabs/header';
import { highlights } from './tabs/highlights';
import { newLayout } from './tabs/newLayout';
import { privacyPolicyPage } from './tabs/privacyPolicyPage';
import { resource } from './tabs/resource';
import { search } from './tabs/search';
import { suggestions } from './tabs/suggestions';
import { termsOfUsePage } from './tabs/termsOfUsePage';
import { topics } from './tabs/topics';

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
      pushFacetsToCacheAfterChangeHook,
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
