import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_rds_search_search_settings_search_engine"
    ADD VALUE IF NOT EXISTS 'v2';

    ALTER TYPE "public"."enum__rds_v_version_search_search_settings_search_engine"
    ADD VALUE IF NOT EXISTS 'v2';

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_enable_v2_api" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_enable_v2_api" boolean DEFAULT FALSE;
  `);
}

// Postgres cannot drop a single enum value; the 'v2' value stays in both enum types.
// Rows that use it fall back to 'ai_classification', which the frontend treats the same.
export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "rds"
    SET
      "search_search_settings_search_engine" = 'ai_classification'
    WHERE
      "search_search_settings_search_engine"::text = 'v2';

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_search_engine" = 'ai_classification'
    WHERE
      "version_search_search_settings_search_engine"::text = 'v2';

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_enable_v2_api";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_enable_v2_api";
  `);
}
