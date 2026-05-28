import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    ADD COLUMN "header_feedback_button_label" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_header_feedback_button_label" varchar;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    DROP COLUMN "header_feedback_button_label";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_header_feedback_button_label";
  `);
}
