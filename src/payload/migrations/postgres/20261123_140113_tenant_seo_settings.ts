import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" ADD COLUMN "seo_sitemap" boolean DEFAULT true;
  ALTER TABLE "tenants" ADD COLUMN "seo_canonical_host" varchar;
  ALTER TABLE "tenants" ADD COLUMN "seo_search_console_property" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" DROP COLUMN "seo_sitemap";
  ALTER TABLE "tenants" DROP COLUMN "seo_canonical_host";
  ALTER TABLE "tenants" DROP COLUMN "seo_search_console_property";`)
}
