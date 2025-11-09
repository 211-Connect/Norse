import type { CollectionConfig } from 'payload';

import { superAdminOrTenantAdminAccess } from './access/superAdminOrTenantAdmin';
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

export const ResourceDirectories: CollectionConfig = {
  slug: 'resource-directories',
  // This avoid 63 character limit for some names
  dbName: 'rds',
  access: {
    create: isSuperAdminAccess,
    delete: isSuperAdminAccess,
  },
  versions: {
    drafts: false,
  },
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    beforeChange: [setTenantIdAsId, preventUpdateInDisabledLocale],
    afterChange: [revalidateCache],
    afterDelete: [revalidateCache, disableService],
  },
  fields: [
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
          admin: {
            readOnly: true,
          },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        common,
        brand,
        header,
        footer,
        suggestions,
        topics,
        search,
        newLayout,
        privacyPolicyPage,
        termsOfUsePage,
        featureFlags,
      ],
    },
  ],
};
