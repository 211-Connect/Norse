import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_rds_badges_list_style" AS ENUM('bold', 'light', 'outline');
  CREATE TYPE "public"."enum__rds_v_version_badges_list_style" AS ENUM('bold', 'light', 'outline');
  CREATE TABLE "rds_badges_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"filter" varchar NOT NULL,
  	"style" "enum_rds_badges_list_style" DEFAULT 'bold' NOT NULL,
  	"color" varchar DEFAULT '#0044B5' NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "rds_badges_list_locales" (
  	"badge_label" varchar,
  	"tooltip" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_badges_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"filter" varchar NOT NULL,
  	"style" "enum__rds_v_version_badges_list_style" DEFAULT 'bold' NOT NULL,
  	"color" varchar DEFAULT '#0044B5' NOT NULL,
  	"icon" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_badges_list_locales" (
  	"badge_label" varchar,
  	"tooltip" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "rds_badges_list" ADD CONSTRAINT "rds_badges_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_badges_list_locales" ADD CONSTRAINT "rds_badges_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_badges_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_badges_list" ADD CONSTRAINT "_rds_v_version_badges_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_badges_list_locales" ADD CONSTRAINT "_rds_v_version_badges_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_badges_list"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rds_badges_list_order_idx" ON "rds_badges_list" USING btree ("_order");
  CREATE INDEX "rds_badges_list_parent_id_idx" ON "rds_badges_list" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rds_badges_list_locales_locale_parent_id_unique" ON "rds_badges_list_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_badges_list_order_idx" ON "_rds_v_version_badges_list" USING btree ("_order");
  CREATE INDEX "_rds_v_version_badges_list_parent_id_idx" ON "_rds_v_version_badges_list" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_badges_list_locales_locale_parent_id_unique" ON "_rds_v_version_badges_list_locales" USING btree ("_locale","_parent_id");`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rds_badges_list" CASCADE;
  DROP TABLE "rds_badges_list_locales" CASCADE;
  DROP TABLE "_rds_v_version_badges_list" CASCADE;
  DROP TABLE "_rds_v_version_badges_list_locales" CASCADE;
  DROP TYPE "public"."enum_rds_badges_list_style";
  DROP TYPE "public"."enum__rds_v_version_badges_list_style";`);
}
