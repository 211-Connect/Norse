import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ALTER COLUMN "topics_image_border_radius"
    SET DEFAULT 0;

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_topics_image_border_radius"
    SET DEFAULT 0;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ALTER COLUMN "topics_image_border_radius"
    DROP DEFAULT;

    ALTER TABLE "_rds_v"
    ALTER COLUMN "version_topics_image_border_radius"
    DROP DEFAULT;
  `);
}
