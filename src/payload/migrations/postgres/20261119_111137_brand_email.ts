import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "brand_email" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_brand_email" varchar;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "brand_email";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_brand_email";
  `);
}
