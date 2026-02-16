import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds_custom_attributes_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TYPE "public"."enum__rds_v_version_custom_attributes_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TABLE "rds_custom_attributes_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum_rds_custom_attributes_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true
  );
  
  CREATE TABLE "rds_custom_attributes_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_custom_attributes_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum__rds_v_version_custom_attributes_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_custom_attributes_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "rds_custom_attributes_attributes" ADD CONSTRAINT "rds_custom_attributes_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_custom_attributes_attributes_locales" ADD CONSTRAINT "rds_custom_attributes_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_custom_attributes_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes" ADD CONSTRAINT "_rds_v_version_custom_attributes_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes_locales" ADD CONSTRAINT "_rds_v_version_custom_attributes_attributes_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_custom_attributes_attributes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rds_custom_attributes_attributes_order_idx" ON "rds_custom_attributes_attributes" USING btree ("_order");
  CREATE INDEX "rds_custom_attributes_attributes_parent_id_idx" ON "rds_custom_attributes_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rds_custom_attributes_attributes_locales_locale_parent_id_un" ON "rds_custom_attributes_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_custom_attributes_attributes_order_idx" ON "_rds_v_version_custom_attributes_attributes" USING btree ("_order");
  CREATE INDEX "_rds_v_version_custom_attributes_attributes_parent_id_idx" ON "_rds_v_version_custom_attributes_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_custom_attributes_attributes_locales_locale_p" ON "_rds_v_version_custom_attributes_attributes_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rds_custom_attributes_attributes" CASCADE;
  DROP TABLE "rds_custom_attributes_attributes_locales" CASCADE;
  DROP TABLE "_rds_v_version_custom_attributes_attributes" CASCADE;
  DROP TABLE "_rds_v_version_custom_attributes_attributes_locales" CASCADE;
  DROP TYPE "public"."enum_rds_custom_attributes_attributes_link_entity";
  DROP TYPE "public"."enum__rds_v_version_custom_attributes_attributes_link_entity";`)
}
