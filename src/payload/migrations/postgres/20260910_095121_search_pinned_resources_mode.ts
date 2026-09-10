import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."pinned_mode" AS ENUM('ignore', 'boost', 'top');

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_pinned_resources_mode" "pinned_mode" DEFAULT 'boost';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_pinned_resources_mode" "pinned_mode" DEFAULT 'boost';
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_pinned_resources_mode";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_pinned_resources_mode";

    DROP TYPE "public"."pinned_mode";
  `);
}
