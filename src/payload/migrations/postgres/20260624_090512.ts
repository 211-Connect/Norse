import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_rds_search_search_settings_search_engine" AS ENUM('classic', 'hybrid', 'ai_classification');

    CREATE TYPE "public"."enum__rds_v_version_search_search_settings_search_engine" AS ENUM('classic', 'hybrid', 'ai_classification');

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_search_engine" "enum_rds_search_search_settings_search_engine" DEFAULT 'classic';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_search_engine" "enum__rds_v_version_search_search_settings_search_engine" DEFAULT 'classic';
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_search_engine";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_search_engine";

    DROP TYPE "public"."enum_rds_search_search_settings_search_engine";

    DROP TYPE "public"."enum__rds_v_version_search_search_settings_search_engine";
  `);
}
