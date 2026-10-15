import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_max_resources_configurable";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_default_max_resources";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_max_resources_configurable";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_default_max_resources";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_max_resources_configurable" boolean DEFAULT TRUE;

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_default_max_resources" numeric DEFAULT 100;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_max_resources_configurable" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_default_max_resources" numeric DEFAULT 100;
  `);
}
