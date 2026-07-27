import { postgresAdapter } from '@payloadcms/db-postgres';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { s3Storage } from '@payloadcms/storage-s3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Endpoint, buildConfig } from 'payload';
import sharp from 'sharp';

import { getNumberFromString } from '@/utils/getNumberFromString';

import { WidgetSlug } from './components/analytics/widgetInfo';
import { HybridSearchConfig } from './collections/HybridSearchConfig';
import { OrchestrationConfig } from './collections/OrchestrationConfig';
import { ResourceDirectories } from './collections/ResourceDirectories';
import { TenantMedia } from './collections/TenantMedia';
import { Tenants } from './collections/Tenants';
import {
  findTenantByHost,
  findTenantById,
} from './collections/Tenants/actions';
import { Users } from './collections/Users';
import { isSuperAdmin, isSupport } from './collections/Users/access/roles';
import { analyticsProxyEndpoints } from './endpoints/analyticsProxy';
import { clearCache } from './endpoints/clearCache';
import { duplicateTenant } from './endpoints/duplicateTenant';
import { exportSearchAnalytics } from './endpoints/exportSearchAnalytics';
import { keycloakVerifiedUsers } from './endpoints/keycloakVerifiedUsers';
import { populateApiConfigCache } from './endpoints/populateApiConfigCache';
import { translateEndpoint } from './endpoints/translate';
import {
  taxonomyScorecardsGet,
  taxonomyScorecardsEnable,
  taxonomyScorecardsSearch,
  taxonomyScorecardsStatus,
  taxonomyScorecardsUpdate,
} from './endpoints/taxonomyScorecards';
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
  populateApiConfigCache,
  translateEndpoint,
  duplicateTenant,
  exportSearchAnalytics,
  taxonomyScorecardsStatus,
  taxonomyScorecardsSearch,
  taxonomyScorecardsGet,
  taxonomyScorecardsUpdate,
  taxonomyScorecardsEnable,
  keycloakVerifiedUsers,
  seedEndpoint,
  ...analyticsProxyEndpoints,
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
    HybridSearchConfig,
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
      beforeNavLinks: ['@/payload/components/AnalyticsNavLink'],
      afterNavLinks: [
        '@/payload/components/ScorecardsNavLink',
        '@/payload/components/PopulateApiConfigCacheButton',
        '@/payload/components/ClearCacheButton',
      ],
      views: {
        dashboard: {
          Component: '@/payload/components/AnalyticsView',
        },
        analytics: {
          Component: '@/payload/components/AnalyticsRedirectView',
          path: '/analytics',
          exact: true,
        },
        scorecards: {
          Component: '@/payload/components/ScorecardsView',
          path: '/scorecards',
          exact: true,
        },
      },
    },
    dashboard: {
      widgets: [
        {
          slug: WidgetSlug.TotalUsers,
          Component:
            '@/payload/components/analytics/widgets/TotalUsersWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.Searches,
          Component:
            '@/payload/components/analytics/widgets/SearchesWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.AverageSearches,
          Component:
            '@/payload/components/analytics/widgets/AnalyticsAverageSerachesWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ResourceViews,
          Component:
            '@/payload/components/analytics/widgets/ResourceViewsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ZeroResults,
          Component:
            '@/payload/components/analytics/widgets/ZeroResultsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.WebsiteClicks,
          Component:
            '@/payload/components/analytics/widgets/WebsiteClicksWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.PhoneCalls,
          Component:
            '@/payload/components/analytics/widgets/PhoneCallsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.Directions,
          Component:
            '@/payload/components/analytics/widgets/DirectionsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.TotalReferrals,
          Component:
            '@/payload/components/analytics/widgets/TotalReferralsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.WidgetSearches,
          Component:
            '@/payload/components/analytics/widgets/WidgetSearchesWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.CalloutClicks,
          Component:
            '@/payload/components/analytics/widgets/CalloutClicksWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.PageViews,
          Component:
            '@/payload/components/analytics/widgets/PageViewsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.PageviewsChart,
          Component:
            '@/payload/components/analytics/widgets/PageviewsChartWidget#default',
          minWidth: 'large',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.Map,
          Component:
            '@/payload/components/analytics/widgets/AnalyticsMapWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ResourceTitles,
          Component:
            '@/payload/components/analytics/widgets/ResourceTitlesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.SearchQueries,
          Component:
            '@/payload/components/analytics/widgets/SearchQueriesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ZipCodeSearches,
          Component:
            '@/payload/components/analytics/widgets/ZipCodeSearchesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.CountySearches,
          Component:
            '@/payload/components/analytics/widgets/CountySearchesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ResourceEntryPoints,
          Component:
            '@/payload/components/analytics/widgets/ResourceEntryPointsWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.ZeroResultQueries,
          Component:
            '@/payload/components/analytics/widgets/ZeroResultQueriesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.SessionQuality,
          Component:
            '@/payload/components/analytics/widgets/SessionQualityWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.DeviceTypes,
          Component:
            '@/payload/components/analytics/widgets/DeviceTypesWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.SafeExitClicks,
          Component:
            '@/payload/components/analytics/widgets/SafeExitClicksWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.LanguageSwitchDestinations,
          Component:
            '@/payload/components/analytics/widgets/LanguageSwitchDestinationsWidget#default',
          minWidth: 'medium',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.FavoriteAddToList,
          Component:
            '@/payload/components/analytics/widgets/FavoriteAddToListWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: WidgetSlug.VerifiedUsers,
          Component:
            '@/payload/components/analytics/widgets/VerifiedUsersWidget#default',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
        {
          slug: 'analytics-event-card',
          Component:
            '@/payload/components/analytics/widgets/EventCardWidget#default',
          label: 'Event card',
          minWidth: 'x-small',
          maxWidth: 'full',
        },
      ],
      // Note: the default layout is defined in AnalyticsView, which is
      // registered as `admin.components.views.dashboard.Component` above
      // and patches this config's widgets/layout at render time.
    },
  },
  secret: process.env.PAYLOAD_SECRET as string,
  email: process.env.SENDGRID_API_KEY
    ? nodemailerAdapter({
        defaultFromAddress: 'support@connect211.com',
        defaultFromName: 'Connect 211 Support Team',
        transportOptions: sendGridTransport({
          apiKey: process.env.SENDGRID_API_KEY,
        }),
      })
    : undefined,
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
    filterAvailableLocales: async ({ locales, req: { user, host, url } }) => {
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
        [HybridSearchConfig.slug]: {
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
