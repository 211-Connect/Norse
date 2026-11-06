import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_show_all_results_on_map" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_show_all_results_on_map" boolean DEFAULT FALSE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_show_all_results_on_map";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_show_all_results_on_map";
  `);
}
