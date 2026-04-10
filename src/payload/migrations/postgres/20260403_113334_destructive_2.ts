import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Make locale columns nullable to allow inserts/updates without specifying them
  // This is a temporary step before the destructive migration that removes these columns
  await db.execute(sql`
  ALTER TABLE "rds_common_alert" ALTER COLUMN "_locale" DROP NOT NULL;
  ALTER TABLE "rds_common_alert" ALTER COLUMN "text" DROP NOT NULL;
  
  ALTER TABLE "rds_new_layout_callouts_options" ALTER COLUMN "_locale" DROP NOT NULL;
  
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "_locale" DROP NOT NULL;
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "text" DROP NOT NULL;
  
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ALTER COLUMN "_locale" DROP NOT NULL;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  // Restore NOT NULL constraints
  await db.execute(sql`
  ALTER TABLE "rds_common_alert" ALTER COLUMN "_locale" SET NOT NULL;
  ALTER TABLE "rds_common_alert" ALTER COLUMN "text" SET NOT NULL;
  
  ALTER TABLE "rds_new_layout_callouts_options" ALTER COLUMN "_locale" SET NOT NULL;
  
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "_locale" SET NOT NULL;
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "text" SET NOT NULL;
  
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ALTER COLUMN "_locale" SET NOT NULL;
  `);
}
