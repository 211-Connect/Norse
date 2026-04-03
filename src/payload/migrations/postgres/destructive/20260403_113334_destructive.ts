import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX "rds_common_alert_locale_idx";
  DROP INDEX "rds_new_layout_callouts_options_locale_idx";
  DROP INDEX "_rds_v_version_common_alert_locale_idx";
  DROP INDEX "_rds_v_version_new_layout_callouts_options_locale_idx";
  ALTER TABLE "rds_common_alert" DROP COLUMN "_locale";
  ALTER TABLE "rds_common_alert" DROP COLUMN "text";
  ALTER TABLE "rds_common_alert" DROP COLUMN "button_text";
  ALTER TABLE "rds_new_layout_callouts_options" DROP COLUMN "_locale";
  ALTER TABLE "rds_new_layout_callouts_options" DROP COLUMN "description";
  ALTER TABLE "rds_new_layout_callouts_options" DROP COLUMN "title";
  ALTER TABLE "_rds_v_version_common_alert" DROP COLUMN "_locale";
  ALTER TABLE "_rds_v_version_common_alert" DROP COLUMN "text";
  ALTER TABLE "_rds_v_version_common_alert" DROP COLUMN "button_text";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" DROP COLUMN "_locale";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" DROP COLUMN "description";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" DROP COLUMN "title";`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_common_alert" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "rds_common_alert" ADD COLUMN "text" varchar NOT NULL;
  ALTER TABLE "rds_common_alert" ADD COLUMN "button_text" varchar;
  ALTER TABLE "rds_new_layout_callouts_options" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "rds_new_layout_callouts_options" ADD COLUMN "description" varchar;
  ALTER TABLE "rds_new_layout_callouts_options" ADD COLUMN "title" varchar;
  ALTER TABLE "_rds_v_version_common_alert" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_rds_v_version_common_alert" ADD COLUMN "text" varchar NOT NULL;
  ALTER TABLE "_rds_v_version_common_alert" ADD COLUMN "button_text" varchar;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD COLUMN "description" varchar;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD COLUMN "title" varchar;
  CREATE INDEX "rds_common_alert_locale_idx" ON "rds_common_alert" USING btree ("_locale");
  CREATE INDEX "rds_new_layout_callouts_options_locale_idx" ON "rds_new_layout_callouts_options" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_common_alert_locale_idx" ON "_rds_v_version_common_alert" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_locale_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("_locale");`);
}
