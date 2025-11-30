import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "topics_image_border_radius" numeric;
  ALTER TABLE "_rds_v" ADD COLUMN "version_topics_image_border_radius" numeric;
  ALTER TABLE "rds_topics_list" DROP COLUMN "image_border_radius";
  ALTER TABLE "_rds_v_version_topics_list" DROP COLUMN "image_border_radius";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_topics_list" ADD COLUMN "image_border_radius" numeric DEFAULT 12;
  ALTER TABLE "_rds_v_version_topics_list" ADD COLUMN "image_border_radius" numeric DEFAULT 12;
  ALTER TABLE "rds" DROP COLUMN "topics_image_border_radius";
  ALTER TABLE "_rds_v" DROP COLUMN "version_topics_image_border_radius";`)
}
