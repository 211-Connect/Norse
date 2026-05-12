import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "feature_flags_hide_categories_heading";
  ALTER TABLE "rds" DROP COLUMN "feature_flags_hide_data_providers_heading";
  ALTER TABLE "rds" DROP COLUMN "feature_flags_show_resource_attribution";
  ALTER TABLE "rds" DROP COLUMN "feature_flags_show_resource_categories";
  ALTER TABLE "rds" DROP COLUMN "feature_flags_show_resource_last_assured_date";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_hide_categories_heading";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_hide_data_providers_heading";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_show_resource_attribution";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_show_resource_categories";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_show_resource_last_assured_date";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "feature_flags_hide_categories_heading" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "feature_flags_hide_data_providers_heading" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "feature_flags_show_resource_attribution" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "feature_flags_show_resource_categories" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "feature_flags_show_resource_last_assured_date" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_hide_categories_heading" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_hide_data_providers_heading" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_show_resource_attribution" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_show_resource_categories" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_show_resource_last_assured_date" boolean DEFAULT false;`)
}
