import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_title" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_description" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_h1" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_intro" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_title" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_description" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_h1" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_intro" varchar;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_title";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_description";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_h1";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_intro";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_title";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_description";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_h1";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_intro";
  `);
}
