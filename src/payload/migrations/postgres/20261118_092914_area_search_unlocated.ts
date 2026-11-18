import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

// The boolean column it replaces shipped to dev only (20261117_105248); `true`
// carries over as 'all', everything else takes the new default 'virtual'.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."unlocated" AS ENUM('none', 'virtual', 'all');

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_unlocated_in_area_search" "unlocated" DEFAULT 'virtual';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_unlocated_in_area_search" "unlocated" DEFAULT 'virtual';

    UPDATE "rds"
    SET
      "search_search_settings_unlocated_in_area_search" = 'all'
    WHERE
      "search_search_settings_include_unlocated_in_area_search" IS TRUE;

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_unlocated_in_area_search" = 'all'
    WHERE
      "version_search_search_settings_include_unlocated_in_area_search" IS TRUE;

    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_include_unlocated_in_area_search";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_include_unlocated_in_area_search";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_include_unlocated_in_area_search" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_include_unlocated_in_area_search" boolean DEFAULT FALSE;

    UPDATE "rds"
    SET
      "search_search_settings_include_unlocated_in_area_search" = TRUE
    WHERE
      "search_search_settings_unlocated_in_area_search" = 'all';

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_include_unlocated_in_area_search" = TRUE
    WHERE
      "version_search_search_settings_unlocated_in_area_search" = 'all';

    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_unlocated_in_area_search";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_unlocated_in_area_search";

    DROP TYPE "public"."unlocated";
  `);
}
