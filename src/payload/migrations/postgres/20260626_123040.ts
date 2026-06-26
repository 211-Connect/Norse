import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "accessibility_page_enabled" boolean DEFAULT true;
  ALTER TABLE "rds" ADD COLUMN "accessibility_page_title" varchar DEFAULT 'Accessibility';
  ALTER TABLE "rds" ADD COLUMN "accessibility_page_content" varchar;
  ALTER TABLE "_rds_v" ADD COLUMN "version_accessibility_page_enabled" boolean DEFAULT true;
  ALTER TABLE "_rds_v" ADD COLUMN "version_accessibility_page_title" varchar DEFAULT 'Accessibility';
  ALTER TABLE "_rds_v" ADD COLUMN "version_accessibility_page_content" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "accessibility_page_enabled";
  ALTER TABLE "rds" DROP COLUMN "accessibility_page_title";
  ALTER TABLE "rds" DROP COLUMN "accessibility_page_content";
  ALTER TABLE "_rds_v" DROP COLUMN "version_accessibility_page_enabled";
  ALTER TABLE "_rds_v" DROP COLUMN "version_accessibility_page_title";
  ALTER TABLE "_rds_v" DROP COLUMN "version_accessibility_page_content";`)
}
