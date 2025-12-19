import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildConfig, Endpoint } from 'payload';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant';
import { Config, Tenant } from './payload-types';
import { s3Storage } from '@payloadcms/storage-s3';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';

import { findByHost } from './collections/ResourceDirectories/services/findByHost';
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

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const endpoints: Endpoint[] = [clearCache, seedEndpoint];

if (process.env.NODE_ENV === 'development') {
  endpoints.push(addLocalAdminEndpoint);
}

const config = buildConfig({
  collections: [Users, Tenants, TenantMedia, ResourceDirectories],
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

      const resourceDirectory = await findByHost(payload, host, defaultLocale);
      if (resourceDirectory) {
        const tenant = resourceDirectory.tenant as Tenant;
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
});

export default config;
