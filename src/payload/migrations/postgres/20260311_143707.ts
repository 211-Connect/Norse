import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_left_col_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'phoneNumbers', 'website', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  CREATE TYPE "public"."customAttributeSize" AS ENUM('sm', 'md');
  CREATE TYPE "public"."urlTarget" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_right_col_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'phoneNumbers', 'website', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  CREATE TYPE "public"."enum__left_col_v_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'phoneNumbers', 'website', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  CREATE TYPE "public"."enum__right_col_v_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'phoneNumbers', 'website', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  CREATE TABLE "left_col_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"component_id" "enum_left_col_items_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self'
  );
  
  CREATE TABLE "left_col_items_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "left_col" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"is_card" boolean DEFAULT true
  );
  
  CREATE TABLE "right_col_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"component_id" "enum_right_col_items_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self'
  );
  
  CREATE TABLE "right_col_items_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "right_col" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"is_card" boolean DEFAULT true
  );
  
  CREATE TABLE "_left_col_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"component_id" "enum__left_col_v_items_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_left_col_v_items_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_left_col_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_card" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_right_col_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"component_id" "enum__right_col_v_items_component_id",
  	"custom_attribute_icon" varchar,
  	"custom_attribute_icon_color" varchar DEFAULT '',
  	"custom_attribute_size" "customAttributeSize" DEFAULT 'sm',
  	"custom_attribute_title_below" boolean,
  	"custom_attribute_url" varchar,
  	"custom_attribute_url_target" "urlTarget" DEFAULT '_self',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_right_col_v_items_locales" (
  	"custom_attribute_title" varchar,
  	"custom_attribute_subtitle" varchar,
  	"custom_attribute_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_right_col_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"is_card" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  ALTER TABLE "rds" ADD COLUMN "resource_use_custom_layout" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_resource_use_custom_layout" boolean DEFAULT false;
  ALTER TABLE "left_col_items" ADD CONSTRAINT "left_col_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."left_col"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "left_col_items_locales" ADD CONSTRAINT "left_col_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."left_col_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "left_col" ADD CONSTRAINT "left_col_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "right_col_items" ADD CONSTRAINT "right_col_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."right_col"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "right_col_items_locales" ADD CONSTRAINT "right_col_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."right_col_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "right_col" ADD CONSTRAINT "right_col_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_left_col_v_items" ADD CONSTRAINT "_left_col_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_left_col_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_left_col_v_items_locales" ADD CONSTRAINT "_left_col_v_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_left_col_v_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_left_col_v" ADD CONSTRAINT "_left_col_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_right_col_v_items" ADD CONSTRAINT "_right_col_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_right_col_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_right_col_v_items_locales" ADD CONSTRAINT "_right_col_v_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_right_col_v_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_right_col_v" ADD CONSTRAINT "_right_col_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "left_col_items_order_idx" ON "left_col_items" USING btree ("_order");
  CREATE INDEX "left_col_items_parent_id_idx" ON "left_col_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "left_col_items_locales_locale_parent_id_unique" ON "left_col_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "left_col_order_idx" ON "left_col" USING btree ("_order");
  CREATE INDEX "left_col_parent_id_idx" ON "left_col" USING btree ("_parent_id");
  CREATE INDEX "right_col_items_order_idx" ON "right_col_items" USING btree ("_order");
  CREATE INDEX "right_col_items_parent_id_idx" ON "right_col_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "right_col_items_locales_locale_parent_id_unique" ON "right_col_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "right_col_order_idx" ON "right_col" USING btree ("_order");
  CREATE INDEX "right_col_parent_id_idx" ON "right_col" USING btree ("_parent_id");
  CREATE INDEX "_left_col_v_items_order_idx" ON "_left_col_v_items" USING btree ("_order");
  CREATE INDEX "_left_col_v_items_parent_id_idx" ON "_left_col_v_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_left_col_v_items_locales_locale_parent_id_unique" ON "_left_col_v_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_left_col_v_order_idx" ON "_left_col_v" USING btree ("_order");
  CREATE INDEX "_left_col_v_parent_id_idx" ON "_left_col_v" USING btree ("_parent_id");
  CREATE INDEX "_right_col_v_items_order_idx" ON "_right_col_v_items" USING btree ("_order");
  CREATE INDEX "_right_col_v_items_parent_id_idx" ON "_right_col_v_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_right_col_v_items_locales_locale_parent_id_unique" ON "_right_col_v_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_right_col_v_order_idx" ON "_right_col_v" USING btree ("_order");
  CREATE INDEX "_right_col_v_parent_id_idx" ON "_right_col_v" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "left_col_items" CASCADE;
  DROP TABLE "left_col_items_locales" CASCADE;
  DROP TABLE "left_col" CASCADE;
  DROP TABLE "right_col_items" CASCADE;
  DROP TABLE "right_col_items_locales" CASCADE;
  DROP TABLE "right_col" CASCADE;
  DROP TABLE "_left_col_v_items" CASCADE;
  DROP TABLE "_left_col_v_items_locales" CASCADE;
  DROP TABLE "_left_col_v" CASCADE;
  DROP TABLE "_right_col_v_items" CASCADE;
  DROP TABLE "_right_col_v_items_locales" CASCADE;
  DROP TABLE "_right_col_v" CASCADE;
  ALTER TABLE "rds" DROP COLUMN "resource_use_custom_layout";
  ALTER TABLE "_rds_v" DROP COLUMN "version_resource_use_custom_layout";
  DROP TYPE "public"."enum_left_col_items_component_id";
  DROP TYPE "public"."customAttributeSize";
  DROP TYPE "public"."urlTarget";
  DROP TYPE "public"."enum_right_col_items_component_id";
  DROP TYPE "public"."enum__left_col_v_items_component_id";
  DROP TYPE "public"."enum__right_col_v_items_component_id";`)
}
