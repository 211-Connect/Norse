import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "rds_common_alert_locales" (
  	"text" varchar NOT NULL,
  	"button_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "rds_new_layout_callouts_options_locales" (
  	"description" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_common_alert_locales" (
  	"text" varchar NOT NULL,
  	"button_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_new_layout_callouts_options_locales" (
  	"description" varchar,
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "analytics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_id" integer;
  ALTER TABLE "rds_common_alert_locales" ADD CONSTRAINT "rds_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_common_alert"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_new_layout_callouts_options_locales" ADD CONSTRAINT "rds_new_layout_callouts_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_new_layout_callouts_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_common_alert_locales" ADD CONSTRAINT "_rds_v_version_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_common_alert"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options_locales" ADD CONSTRAINT "_rds_v_version_new_layout_callouts_options_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_new_layout_callouts_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rds_common_alert_locales_locale_parent_id_unique" ON "rds_common_alert_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "rds_new_layout_callouts_options_locales_locale_parent_id_uni" ON "rds_new_layout_callouts_options_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_common_alert_locales_locale_parent_id_unique" ON "_rds_v_version_common_alert_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_new_layout_callouts_options_locales_locale_pa" ON "_rds_v_version_new_layout_callouts_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "analytics_updated_at_idx" ON "analytics" USING btree ("updated_at");
  CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_fk" FOREIGN KEY ("analytics_id") REFERENCES "public"."analytics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_common_alert_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rds_new_layout_callouts_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_common_alert_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "analytics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rds_common_alert_locales" CASCADE;
  DROP TABLE "rds_new_layout_callouts_options_locales" CASCADE;
  DROP TABLE "_rds_v_version_common_alert_locales" CASCADE;
  DROP TABLE "_rds_v_version_new_layout_callouts_options_locales" CASCADE;
  DROP TABLE "analytics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_id";`);
}
