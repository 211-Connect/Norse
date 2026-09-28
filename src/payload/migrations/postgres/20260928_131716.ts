import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "header_feedback_url" varchar;

    ALTER TABLE "rds"
    ADD COLUMN "footer_copyright" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_header_feedback_url" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_footer_copyright" varchar;

    UPDATE "rds"
    SET
      "footer_copyright" = "brand_copyright",
      "header_feedback_url" = "brand_feedback_url";

    UPDATE "_rds_v"
    SET
      "version_footer_copyright" = "version_brand_copyright",
      "version_header_feedback_url" = "version_brand_feedback_url";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "rds"
    SET
      "brand_copyright" = "footer_copyright",
      "brand_feedback_url" = "header_feedback_url";

    UPDATE "_rds_v"
    SET
      "version_brand_copyright" = "version_footer_copyright",
      "version_brand_feedback_url" = "version_header_feedback_url";

    ALTER TABLE "rds"
    DROP COLUMN "header_feedback_url";

    ALTER TABLE "rds"
    DROP COLUMN "footer_copyright";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_header_feedback_url";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_footer_copyright";
  `);
}
