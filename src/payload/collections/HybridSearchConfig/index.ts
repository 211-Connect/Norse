import type { CollectionConfig } from 'payload';

import { invalidateApiCache } from '../ResourceDirectories/hooks/invalidateApiCache';
import { setTenantIdAsId } from '../ResourceDirectories/hooks/setTenantIdAsId';
import { superAdminAccess } from '../Users/access/roles';
import { pushHybridSearchConfigToCacheAfterChangeHook } from './hooks/pushHybridSearchConfigToCache';

export const HybridSearchConfig: CollectionConfig = {
  slug: 'hybrid-search-config',
  // Shortened database name to avoid 63 character limit for enum names
  dbName: 'hsc',
  access: {
    create: superAdminAccess,
    read: superAdminAccess,
    update: superAdminAccess,
    delete: superAdminAccess,
  },
  labels: {
    singular: 'Hybrid Search Config',
    plural: 'Hybrid Search Config',
  },
  versions: {
    drafts: false,
  },
  hooks: {
    beforeChange: [setTenantIdAsId],
    afterChange: [
      pushHybridSearchConfigToCacheAfterChangeHook,
      invalidateApiCache,
    ],
  },
  fields: [
    {
      type: 'ui',
      name: 'tenantHeader',
      admin: {
        position: 'above',
        components: {
          Field:
            '@/payload/collections/HybridSearchConfig/components/HybridSearchConfigHeader',
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
      type: 'collapsible',
      label: 'Vector & Taxonomy Boost',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'vectorScoreWeight',
              type: 'number',
              admin: {
                description:
                  'Weight applied to the vector/semantic similarity score. Leave empty to use the API default (100).',
              },
            },
            {
              name: 'baseTaxonomyBoost',
              type: 'number',
              admin: {
                description:
                  "Base boost for a matched predicted taxonomy code, multiplied by the code's prediction score and a rank-decay factor. Leave empty to use the API default (50).",
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Geo Boost',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'geoGaussWeight',
              type: 'number',
              admin: {
                description:
                  'Weight of the Gaussian distance-decay boost applied to geo-located results. Leave empty to use the API default (1.5).',
              },
            },
            {
              name: 'geoDefaultScaleMi',
              type: 'number',
              admin: {
                description:
                  'Default distance (miles) at which the Gaussian geo boost decays. Leave empty to use the API default (5).',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Pinned & Priority',
      admin: {
        description:
          'Used when Boost Pinned Resources is enabled (Settings → Search), so pinned/priority resources get a score contribution instead of a hard sort tier.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'pinnedScoreBoost',
              type: 'number',
              admin: {
                description:
                  'Score contribution added for pinned resources. Leave empty to use the API default (5).',
              },
            },
            {
              name: 'priorityScoreWeight',
              type: 'number',
              admin: {
                description:
                  'Score contribution added for priority resources. Leave empty to use the API default (1).',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'BM25 Text Boosts',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'bm25NameBoost',
              type: 'number',
              admin: {
                description:
                  'BM25 boost for resource/location name matches. Leave empty to use the API default (15).',
              },
            },
            {
              name: 'bm25ServiceNameBoost',
              type: 'number',
              admin: {
                description:
                  'BM25 boost for service name matches. Leave empty to use the API default (10).',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'bm25OrgNameBoost',
              type: 'number',
              admin: {
                description:
                  'BM25 boost for organization name matches. Leave empty to use the API default (6).',
              },
            },
            {
              name: 'bm25TaxonomyUseRefBoost',
              type: 'number',
              admin: {
                description:
                  'BM25 boost for matches against curated taxonomy use-references (aliases such as "Girl Scouts" for Scouting Programs) — a stronger intent signal than a generic text match. Leave empty to use the API default (12).',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Taxonomy kNN',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'taxonomyK',
              type: 'number',
              admin: {
                description:
                  'Number of nearest-neighbor taxonomy codes to retrieve (k). Leave empty to use the API default (10).',
              },
            },
            {
              name: 'taxonomyNumCandidates',
              type: 'number',
              admin: {
                description:
                  'Number of candidates considered during taxonomy kNN search. Leave empty to use the API default (500).',
              },
            },
          ],
        },
      ],
    },
  ],
};
