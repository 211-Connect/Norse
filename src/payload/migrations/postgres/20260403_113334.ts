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
  
  ALTER TABLE "rds_common_alert_locales" ADD CONSTRAINT "rds_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_common_alert"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_new_layout_callouts_options_locales" ADD CONSTRAINT "rds_new_layout_callouts_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_new_layout_callouts_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_common_alert_locales" ADD CONSTRAINT "_rds_v_version_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_common_alert"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options_locales" ADD CONSTRAINT "_rds_v_version_new_layout_callouts_options_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_new_layout_callouts_options"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rds_common_alert_locales_locale_parent_id_unique" ON "rds_common_alert_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "rds_new_layout_callouts_options_locales_locale_parent_id_uni" ON "rds_new_layout_callouts_options_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_common_alert_locales_locale_parent_id_unique" ON "_rds_v_version_common_alert_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_new_layout_callouts_options_locales_locale_pa" ON "_rds_v_version_new_layout_callouts_options_locales" USING btree ("_locale","_parent_id");`);
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
  DROP TABLE "rds_common_alert_locales" CASCADE;
  DROP TABLE "rds_new_layout_callouts_options_locales" CASCADE;
  DROP TABLE "_rds_v_version_common_alert_locales" CASCADE;
  DROP TABLE "_rds_v_version_new_layout_callouts_options_locales" CASCADE;`);
}
