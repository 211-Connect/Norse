import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_common_alert"
    ADD COLUMN "is_active" boolean DEFAULT TRUE;

    ALTER TABLE "rds_highlights_items"
    ADD COLUMN "is_active" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v_version_common_alert"
    ADD COLUMN "is_active" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v_version_highlights_items"
    ADD COLUMN "is_active" boolean DEFAULT TRUE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_common_alert"
    DROP COLUMN "is_active";

    ALTER TABLE "rds_highlights_items"
    DROP COLUMN "is_active";

    ALTER TABLE "_rds_v_version_common_alert"
    DROP COLUMN "is_active";

    ALTER TABLE "_rds_v_version_highlights_items"
    DROP COLUMN "is_active";
  `);
}
