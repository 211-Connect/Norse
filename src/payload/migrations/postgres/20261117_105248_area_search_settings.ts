import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."area_match" AS ENUM('located', 'located_or_serving', 'serving');

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_area_match_mode" "area_match" DEFAULT 'located_or_serving';

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_include_unlocated_in_area_search" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_area_match_mode" "area_match" DEFAULT 'located_or_serving';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_include_unlocated_in_area_search" boolean DEFAULT FALSE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_area_match_mode";

    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_include_unlocated_in_area_search";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_area_match_mode";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_include_unlocated_in_area_search";

    DROP TYPE "public"."area_match";
  `);
}
