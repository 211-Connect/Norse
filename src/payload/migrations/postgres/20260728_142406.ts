import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_boost_pinned_resources"
    SET DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_boost_pinned_resources"
    SET DEFAULT FALSE;

    UPDATE "rds"
    SET
      "search_search_settings_boost_pinned_resources" = FALSE;

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_boost_pinned_resources" = FALSE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_boost_pinned_resources"
    SET DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_boost_pinned_resources"
    SET DEFAULT TRUE;

    UPDATE "rds"
    SET
      "search_search_settings_boost_pinned_resources" = TRUE;

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_boost_pinned_resources" = TRUE;
  `);
}
