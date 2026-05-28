import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drops the legacy scalar common_umami_website_id column from tenants.
  //
  // PREREQUISITE: Migration 20260511_121351 must have already been applied — it
  // copied all values from this column into tenants_common_umami_website_ids before
  // this column is removed.
  //
  // DATA LOSS WARNING: This operation is irreversible in production. The down()
  // function re-adds the column as nullable but cannot restore the original values.
  // Only run this migration once all application instances have been updated to code
  // that no longer reads or writes common_umami_website_id.
  await db.execute(sql`
    ALTER TABLE "tenants"
    DROP COLUMN IF EXISTS "common_umami_website_id";

    DROP TABLE IF EXISTS "tenants_common_umami_website_ids" CASCADE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  // Re-adds the column structure only. Data is NOT restored — the values were
  // migrated to tenants_common_umami_website_ids by migration 20260511_121351
  // and are still available there if needed.
  await db.execute(sql`
    ALTER TABLE "tenants"
    ADD COLUMN IF NOT EXISTS "common_umami_website_id" varchar;

    CREATE TABLE IF NOT EXISTS "tenants_common_umami_website_ids" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "website_id" varchar NOT NULL
    );
  `);
}
