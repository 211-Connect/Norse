import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_locales" ADD COLUMN "search_texts_suggestion_headers_suggestions" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN "search_texts_suggestion_headers_categories" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN "search_texts_suggestion_headers_taxonomies" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN "version_search_texts_suggestion_headers_suggestions" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN "version_search_texts_suggestion_headers_categories" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN "version_search_texts_suggestion_headers_taxonomies" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_locales" DROP COLUMN "search_texts_suggestion_headers_suggestions";
  ALTER TABLE "rds_locales" DROP COLUMN "search_texts_suggestion_headers_categories";
  ALTER TABLE "rds_locales" DROP COLUMN "search_texts_suggestion_headers_taxonomies";
  ALTER TABLE "_rds_v_locales" DROP COLUMN "version_search_texts_suggestion_headers_suggestions";
  ALTER TABLE "_rds_v_locales" DROP COLUMN "version_search_texts_suggestion_headers_categories";
  ALTER TABLE "_rds_v_locales" DROP COLUMN "version_search_texts_suggestion_headers_taxonomies";`)
}
