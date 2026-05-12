import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "tenants_auth_allowed_email_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar
  );
  
  ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "auth_requires_login" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN IF NOT EXISTS "search_texts_use_text_link_for_view_details" boolean DEFAULT false;
  ALTER TABLE "rds_locales" ADD COLUMN IF NOT EXISTS "header_favorites_button_label" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN IF NOT EXISTS "search_texts_suggestion_headers_suggestions" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN IF NOT EXISTS "search_texts_suggestion_headers_categories" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN IF NOT EXISTS "search_texts_suggestion_headers_taxonomies" varchar;
  ALTER TABLE "rds_locales" ADD COLUMN IF NOT EXISTS "search_texts_view_details_text" varchar;
  ALTER TABLE "_rds_v" ADD COLUMN IF NOT EXISTS "version_search_texts_use_text_link_for_view_details" boolean DEFAULT false;
  ALTER TABLE "_rds_v_locales" ADD COLUMN IF NOT EXISTS "version_header_favorites_button_label" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN IF NOT EXISTS "version_search_texts_suggestion_headers_suggestions" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN IF NOT EXISTS "version_search_texts_suggestion_headers_categories" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN IF NOT EXISTS "version_search_texts_suggestion_headers_taxonomies" varchar;
  ALTER TABLE "_rds_v_locales" ADD COLUMN IF NOT EXISTS "version_search_texts_view_details_text" varchar;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'tenants_auth_allowed_email_domains_parent_id_fk'
    ) THEN
      ALTER TABLE "tenants_auth_allowed_email_domains"
      ADD CONSTRAINT "tenants_auth_allowed_email_domains_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id")
      ON DELETE cascade ON UPDATE no action;
    END IF;
  END
  $$;

  CREATE INDEX IF NOT EXISTS "tenants_auth_allowed_email_domains_order_idx" ON "tenants_auth_allowed_email_domains" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "tenants_auth_allowed_email_domains_parent_id_idx" ON "tenants_auth_allowed_email_domains" USING btree ("_parent_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE IF EXISTS "tenants_auth_allowed_email_domains" CASCADE;
  ALTER TABLE "tenants" DROP COLUMN IF EXISTS "auth_requires_login";
  ALTER TABLE "rds" DROP COLUMN IF EXISTS "search_texts_use_text_link_for_view_details";
  ALTER TABLE "rds_locales" DROP COLUMN IF EXISTS "header_favorites_button_label";
  ALTER TABLE "rds_locales" DROP COLUMN IF EXISTS "search_texts_suggestion_headers_suggestions";
  ALTER TABLE "rds_locales" DROP COLUMN IF EXISTS "search_texts_suggestion_headers_categories";
  ALTER TABLE "rds_locales" DROP COLUMN IF EXISTS "search_texts_suggestion_headers_taxonomies";
  ALTER TABLE "rds_locales" DROP COLUMN IF EXISTS "search_texts_view_details_text";
  ALTER TABLE "_rds_v" DROP COLUMN IF EXISTS "version_search_texts_use_text_link_for_view_details";
  ALTER TABLE "_rds_v_locales" DROP COLUMN IF EXISTS "version_header_favorites_button_label";
  ALTER TABLE "_rds_v_locales" DROP COLUMN IF EXISTS "version_search_texts_suggestion_headers_suggestions";
  ALTER TABLE "_rds_v_locales" DROP COLUMN IF EXISTS "version_search_texts_suggestion_headers_categories";
  ALTER TABLE "_rds_v_locales" DROP COLUMN IF EXISTS "version_search_texts_suggestion_headers_taxonomies";
  ALTER TABLE "_rds_v_locales" DROP COLUMN IF EXISTS "version_search_texts_view_details_text";`);
}
