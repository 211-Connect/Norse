import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_rds_search_search_settings_search_engine"
    ADD VALUE 'v2';

    ALTER TYPE "public"."enum__rds_v_version_search_search_settings_search_engine"
    ADD VALUE 'v2';

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_enable_v2_api" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_enable_v2_api" boolean DEFAULT FALSE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_search_engine"
    SET DATA TYPE text;

    UPDATE "rds"
    SET
      "search_search_settings_search_engine" = 'ai_classification'
    WHERE
      "search_search_settings_search_engine" = 'v2';

    UPDATE "_rds_v"
    SET
      "version_search_search_settings_search_engine" = 'ai_classification'
    WHERE
      "version_search_search_settings_search_engine" = 'v2';

    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_search_engine"
    SET DEFAULT 'classic'::text;

    DROP TYPE "public"."enum_rds_search_search_settings_search_engine";

    CREATE TYPE "public"."enum_rds_search_search_settings_search_engine" AS ENUM('classic', 'hybrid', 'ai_classification');

    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_search_engine"
    SET DEFAULT 'classic'::"public"."enum_rds_search_search_settings_search_engine";

    ALTER TABLE "rds"
    ALTER COLUMN "search_search_settings_search_engine"
    SET DATA TYPE "public"."enum_rds_search_search_settings_search_engine" USING "search_search_settings_search_engine"::"public"."enum_rds_search_search_settings_search_engine";

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_search_engine"
    SET DATA TYPE text;

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_search_engine"
    SET DEFAULT 'classic'::text;

    DROP TYPE "public"."enum__rds_v_version_search_search_settings_search_engine";

    CREATE TYPE "public"."enum__rds_v_version_search_search_settings_search_engine" AS ENUM('classic', 'hybrid', 'ai_classification');

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_search_engine"
    SET DEFAULT 'classic'::"public"."enum__rds_v_version_search_search_settings_search_engine";

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_search_search_settings_search_engine"
    SET DATA TYPE "public"."enum__rds_v_version_search_search_settings_search_engine" USING "version_search_search_settings_search_engine"::"public"."enum__rds_v_version_search_search_settings_search_engine";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_enable_v2_api";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_enable_v2_api";
  `);
}
