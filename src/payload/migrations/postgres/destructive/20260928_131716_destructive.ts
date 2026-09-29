import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "brand_copyright";

    ALTER TABLE "rds"
    DROP COLUMN "brand_feedback_url";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_brand_copyright";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_brand_feedback_url";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "brand_copyright" varchar;

    ALTER TABLE "rds"
    ADD COLUMN "brand_feedback_url" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_brand_copyright" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_brand_feedback_url" varchar;
  `);
}
