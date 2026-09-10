import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_boost_pinned_resources";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_boost_pinned_resources";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_boost_pinned_resources" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_boost_pinned_resources" boolean DEFAULT FALSE;
  `);
}
