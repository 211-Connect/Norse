import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX "rds_common_alert_locale_idx";

    DROP INDEX "rds_new_layout_callouts_options_locale_idx";

    DROP INDEX "_rds_v_version_common_alert_locale_idx";

    DROP INDEX "_rds_v_version_new_layout_callouts_options_locale_idx";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX "rds_common_alert_locale_idx" ON "rds_common_alert" USING btree ("_locale");

    CREATE INDEX "rds_new_layout_callouts_options_locale_idx" ON "rds_new_layout_callouts_options" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_common_alert_locale_idx" ON "_rds_v_version_common_alert" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_new_layout_callouts_options_locale_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("_locale");
  `);
}
