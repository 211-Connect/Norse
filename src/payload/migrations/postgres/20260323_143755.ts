import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds_search_card_layout_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'phone', 'website', 'description', 'categories', 'actionButtons', 'separator', 'customAttribute');
  CREATE TYPE "public"."enum_rds_header_position" AS ENUM('sticky', 'static');
  CREATE TYPE "public"."enum__rds_v_version_search_card_layout_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'phone', 'website', 'description', 'categories', 'actionButtons', 'separator', 'customAttribute');
  CREATE TYPE "public"."enum__rds_v_version_header_position" AS ENUM('sticky', 'static');
  CREATE TABLE "rds_search_card_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"component_id" "enum_rds_search_card_layout_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self'
  );
  
  CREATE TABLE "rds_search_card_layout_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_search_card_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"component_id" "enum__rds_v_version_search_card_layout_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_search_card_layout_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "rds" ADD COLUMN "header_position" "enum_rds_header_position" DEFAULT 'sticky';
  ALTER TABLE "rds" ADD COLUMN "search_use_custom_card_layout" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_header_position" "enum__rds_v_version_header_position" DEFAULT 'sticky';
  ALTER TABLE "_rds_v" ADD COLUMN "version_search_use_custom_card_layout" boolean DEFAULT false;
  ALTER TABLE "rds_search_card_layout" ADD CONSTRAINT "rds_search_card_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_search_card_layout_locales" ADD CONSTRAINT "rds_search_card_layout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_search_card_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_search_card_layout" ADD CONSTRAINT "_rds_v_version_search_card_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_search_card_layout_locales" ADD CONSTRAINT "_rds_v_version_search_card_layout_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_search_card_layout"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rds_search_card_layout_order_idx" ON "rds_search_card_layout" USING btree ("_order");
  CREATE INDEX "rds_search_card_layout_parent_id_idx" ON "rds_search_card_layout" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rds_search_card_layout_locales_locale_parent_id_unique" ON "rds_search_card_layout_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_search_card_layout_order_idx" ON "_rds_v_version_search_card_layout" USING btree ("_order");
  CREATE INDEX "_rds_v_version_search_card_layout_parent_id_idx" ON "_rds_v_version_search_card_layout" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_search_card_layout_locales_locale_parent_id_u" ON "_rds_v_version_search_card_layout_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rds_search_card_layout" CASCADE;
  DROP TABLE "rds_search_card_layout_locales" CASCADE;
  DROP TABLE "_rds_v_version_search_card_layout" CASCADE;
  DROP TABLE "_rds_v_version_search_card_layout_locales" CASCADE;
  ALTER TABLE "rds" DROP COLUMN "header_position";
  ALTER TABLE "rds" DROP COLUMN "search_use_custom_card_layout";
  ALTER TABLE "_rds_v" DROP COLUMN "version_header_position";
  ALTER TABLE "_rds_v" DROP COLUMN "version_search_use_custom_card_layout";
  DROP TYPE "public"."enum_rds_search_card_layout_component_id";
  DROP TYPE "public"."enum_rds_header_position";
  DROP TYPE "public"."enum__rds_v_version_search_card_layout_component_id";
  DROP TYPE "public"."enum__rds_v_version_header_position";`)
}
