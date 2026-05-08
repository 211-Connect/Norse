import { getNumberFromString } from '@/utils/getNumberFromString';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Endpoint, buildConfig } from 'payload';
import sharp from 'sharp';

import { OrchestrationConfig } from './collections/OrchestrationConfig';
import { ResourceDirectories } from './collections/ResourceDirectories';
import { TenantMedia } from './collections/TenantMedia';
import { Tenants } from './collections/Tenants';
import { Users } from './collections/Users';
import { isSuperAdmin, isSupport } from './collections/Users/access/roles';
import { clearCache } from './endpoints/clearCache';
import { duplicateTenant } from './endpoints/duplicateTenant';
import { translateEndpoint } from './endpoints/translate';
import { umamiProxy } from './endpoints/umamiProxy';
import { defaultLocale, locales } from './i18n/locales';
import { translate } from './jobs/translate';
import { translateTopics } from './jobs/translateTopics';
import { warmCache } from './jobs/warmCache';
import { addLocalAdminEndpoint, seedEndpoint } from './migrations';
import { Config, Tenant } from './payload-types';
import { getUserTenantIDs } from './utilities/getUserTenantIDs';
import { sendGridTransport } from './utilities/sendgridAdapter';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const endpoints: Endpoint[] = [
  clearCache,
  translateEndpoint,
  duplicateTenant,
  umamiProxy,
  seedEndpoint,
];

if (process.env.NODE_ENV === 'development') {
  endpoints.push(addLocalAdminEndpoint);
}

const config = buildConfig({
  collections: [
    Users,
    Tenants,
    TenantMedia,
    ResourceDirectories,
    OrchestrationConfig,
  ],
  jobs: {
    tasks: [translateTopics, translate, warmCache],
    autoRun: [
      {
        queue: 'translation',
        cron: '* * * * *',
      },
      {
        queue: 'cache',
        cron: '* * * * *',
      },
    ],
    // Make jobs collection visible to super admins only
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      if (!defaultJobsCollection.admin) {
        defaultJobsCollection.admin = {};
      }
      defaultJobsCollection.admin.hidden = ({ user }) => {
        if (!user) return true;

        const roles = user.roles;

        if (Array.isArray(roles) === false) {
          return true;
        }

        return !isSuperAdmin({ roles });
      };
      return defaultJobsCollection;
    },
  },
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, '../'),
    },
    user: Users.slug,
    components: {
      afterNavLinks: [
        '@/payload/components/AnalyticsNavLink',
        '@/payload/components/ClearCacheButton',
      ],
      views: {
        analytics: {
          Component: '@/payload/components/AnalyticsView',
          path: '/analytics',
          exact: true,
        },
      },
    },
    dashboard: {
      widgets: [
        {
          slug: 'analytics-total-users',
          Component:
            '@/payload/components/analytics/widgets/TotalUsersWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-searches',
          Component:
            '@/payload/components/analytics/widgets/SearchesWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-resource-views',
          Component:
            '@/payload/components/analytics/widgets/ResourceViewsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-zero-results',
          Component:
            '@/payload/components/analytics/widgets/ZeroResultsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-website-clicks',
          Component:
            '@/payload/components/analytics/widgets/WebsiteClicksWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-phone-calls',
          Component:
            '@/payload/components/analytics/widgets/PhoneCallsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-directions',
          Component:
            '@/payload/components/analytics/widgets/DirectionsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-widget-searches',
          Component:
            '@/payload/components/analytics/widgets/WidgetSearchesWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-page-views',
          Component:
            '@/payload/components/analytics/widgets/PageViewsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-pageviews-chart',
          Component:
            '@/payload/components/analytics/widgets/PageviewsChartWidget#default',
          minWidth: 'large',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-map',
          Component:
            '@/payload/components/analytics/widgets/AnalyticsMapWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-resource-titles',
          Component:
            '@/payload/components/analytics/widgets/ResourceTitlesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-search-queries',
          Component:
            '@/payload/components/analytics/widgets/SearchQueriesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
      ],
      defaultLayout: [{ widgetSlug: 'collections', width: 'full' as const }],
    },
  },
  secret: process.env.PAYLOAD_SECRET as string,
  email: nodemailerAdapter({
    defaultFromAddress: 'support@connect211.com',
    defaultFromName: 'Connect 211 Support Team',
    transportOptions: sendGridTransport({
      apiKey: process.env.SENDGRID_API_KEY || '',
    }),
  }),
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      min: getNumberFromString(process.env.DATABASE_POOL_MIN, 1),
      max: getNumberFromString(process.env.DATABASE_POOL_MAX, 4),
    },
    allowIDOnCreate: true,
    beforeSchemaInit: [
      ({ schema, adapter }) => {
        // This fixes the issue with filenames being unique across all tenants
        const tenantMediaIndexes = adapter.rawTables.tenant_media.indexes;
        if (tenantMediaIndexes) {
          delete tenantMediaIndexes.tenant_media_filename_idx;
          tenantMediaIndexes.tenant_media_tenant_filename_idx = {
            name: 'tenant_media_tenant_filename_idx',
            unique: true,
            on: ['tenant', 'filename'],
          };
        }

        return schema;
      },
    ],
    migrationDir: path.resolve(dirname, './migrations/postgres'),
  }),
  localization: {
    locales,
    defaultLocale,
    fallback: false,
    filterAvailableLocales: async ({
      locales,
      req: { user, payload, host, url },
    }) => {
      const mapTenantLocales = (tenant: Tenant) =>
        tenant?.enabledLocales?.map((code: string) => ({
          code,
          label: code,
        })) || locales;

      const extractIdFromUrl = (url: string) => {
        const urlWithoutQuery = url.split('?')[0];
        return urlWithoutQuery.split('/').pop() || '';
      };

      // No user - return default locale only
      if (!user) {
        return [{ code: defaultLocale, label: defaultLocale }];
      }

      // Super admin - return all locales or tenant-specific ones for resource directories
      if (isSuperAdmin(user)) {
        if (url?.includes('resource-directories')) {
          const id = extractIdFromUrl(url);
          if (id) {
            const tenant = await findTenantById(id);
            if (tenant) {
              return mapTenantLocales(tenant);
            }
          }
        }
        return locales;
      }

      // Regular user - get locales from tenant based on host
      const tenant = await findTenantByHost(host);
      if (tenant && typeof tenant === 'object') {
        return mapTenantLocales(tenant);
      }

      return locales;
    },
  },
  editor: lexicalEditor(),
  sharp,
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  },
  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        [TenantMedia.slug]: true,
        [ResourceDirectories.slug]: {
          isGlobal: true,
        },
        [OrchestrationConfig.slug]: {
          isGlobal: true,
        },
      },
      tenantField: {
        access: {
          read: () => true,
          update: ({ req }) => {
            if (isSuperAdmin(req.user) || isSupport(req.user)) {
              return true;
            }
            return getUserTenantIDs(req.user).length > 0;
          },
        },
      },
      tenantsArrayField: {
        includeDefaultField: false,
      },
      userHasAccessToAllTenants: (user) =>
        isSuperAdmin(user) || isSupport(user),
    }),
    s3Storage({
      collections: {
        [TenantMedia.slug]: {
          // This will be replaced dynamically by setTenantIdPrefix hook
          prefix: 'tenant-id-placeholder',
          generateFileURL: ({ filename, prefix }) =>
            `https://${process.env.MEDIA_S3_BUCKET}.${process.env.MEDIA_DO_CDN_ENDPOINT}/${prefix}/${filename}`,
        },
      },
      bucket: process.env.MEDIA_S3_BUCKET as string,
      config: {
        credentials: {
          accessKeyId: process.env.MEDIA_S3_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.MEDIA_S3_SECRET_ACCESS_KEY as string,
        },
        endpoint: process.env.MEDIA_S3_ENDPOINT,
        region: process.env.MEDIA_S3_REGION,
        forcePathStyle: process.env.MEDIA_S3_FORCE_PATH_STYLE === 'true',
      },
      acl: 'public-read',
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  endpoints,
});

export default config;
