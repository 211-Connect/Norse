import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildConfig, Endpoint } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { Config } from './payload-types';
import { s3Storage } from '@payloadcms/storage-s3';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';

import { Users } from './collections/Users';
import { Tenants } from './collections/Tenants';
import { TenantMedia } from './collections/TenantMedia';
import { ResourceDirectories } from './collections/ResourceDirectories';
import { defaultLocale, locales } from './i18n/locales';
import { getUserTenantIDs } from './utilities/getUserTenantIDs';

import { seedEndpoint, addLocalAdminEndpoint } from './migrations';
import { isSuperAdmin, isSupport } from './collections/Users/access/roles';
import { sendGridTransport } from './utilities/sendgridAdapter';
import { clearCache } from './endpoints/clearCache';
import { translateTopicsEndpoint } from './endpoints/translateTopics';
import { duplicateTenant } from './endpoints/duplicateTenant';
import { translateTopics } from './jobs/translateTopics';
import { warmCache } from './jobs/warmCache';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const endpoints: Endpoint[] = [
  clearCache,
  translateTopicsEndpoint,
  duplicateTenant,
  seedEndpoint,
];

if (process.env.NODE_ENV === 'development') {
  endpoints.push(addLocalAdminEndpoint);
}

const config = buildConfig({
  collections: [Users, Tenants, TenantMedia, ResourceDirectories],
  jobs: {
    tasks: [translateTopics, warmCache],
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
      afterNavLinks: ['@/payload/components/ClearCacheButton'],
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
      if (!user) {
        return [{ code: defaultLocale, label: defaultLocale }];
      }

      if (isSuperAdmin(user)) {
        return locales;
      }

      const {
        docs: [resourceDirectory],
      } = await payload.find({
        collection: 'resource-directories',
        depth: 1,
        where: {
          and: [
            { 'tenant.trustedDomains.domain': { equals: host } },
            { 'tenant.services.resourceDirectory': { equals: true } },
          ],
        },
        limit: 1,
        pagination: false,
      });

      if (
        resourceDirectory?.tenant &&
        typeof resourceDirectory.tenant === 'object'
      ) {
        const tenant = resourceDirectory.tenant;
        return tenant.enabledLocales.map((code: string) => ({
          code,
          label: code,
        }));
      }

      return locales;
    },
  },
  editor: lexicalEditor(),
  sharp,
  upload: {
    abortOnLimit: true,
    limits: {
      fileSize: 5000000,
    },
  },
  plugins: [
    multiTenantPlugin<Config>({
      collections: {
        [TenantMedia.slug]: true,
        [ResourceDirectories.slug]: {
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
          // This avoid copying media to memory
          // They still do that in 3.47.0
          // https://github.com/payloadcms/payload/blob/v3.47.0/packages/storage-s3/src/staticHandler.ts#L139
          signedDownloads: {
            shouldUseSignedURL: ({}) => true,
          },
          generateFileURL:
            process.env.NODE_ENV !== 'development'
              ? ({ filename, prefix }) =>
                  `https://${process.env.MEDIA_S3_BUCKET}.${process.env.MEDIA_DO_CDN_ENDPOINT}/${prefix}/${filename}`
              : undefined,
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
  onInit: async (payload) => {
    payload.logger.info('Queueing warmCache task on startup...');
    try {
      const job = await payload.jobs.queue({
        task: 'warmCache',
        input: {},
        queue: 'cache',
      });
      payload.logger.info(
        `warmCache task queued successfully with job ID: ${job.id}`,
      );
    } catch (error) {
      payload.logger.error('Failed to queue warmCache task on startup:', error);
    }
  },
});

export default config;
