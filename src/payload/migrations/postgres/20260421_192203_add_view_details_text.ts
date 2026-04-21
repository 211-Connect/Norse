import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_locales" ADD COLUMN "search_texts_view_details_text" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN "version_search_texts_view_details_text" varchar;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_locales" DROP COLUMN "search_texts_view_details_text";
  ALTER TABLE "_rds_v_locales" DROP COLUMN "version_search_texts_view_details_text";`);
}
