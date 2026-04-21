import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "search_texts_use_text_link_for_view_details" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_search_texts_use_text_link_for_view_details" boolean DEFAULT false;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "search_texts_use_text_link_for_view_details";
  ALTER TABLE "_rds_v" DROP COLUMN "version_search_texts_use_text_link_for_view_details";`);
}
