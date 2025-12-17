import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "rds_search_facets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"facet" varchar NOT NULL
  );
  
  CREATE TABLE "rds_search_facets_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_search_facets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"facet" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_search_facets_locales" (
  	"name" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "rds_search_facets" ADD CONSTRAINT "rds_search_facets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_search_facets_locales" ADD CONSTRAINT "rds_search_facets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_search_facets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_search_facets" ADD CONSTRAINT "_rds_v_version_search_facets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_search_facets_locales" ADD CONSTRAINT "_rds_v_version_search_facets_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_search_facets"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rds_search_facets_order_idx" ON "rds_search_facets" USING btree ("_order");
  CREATE INDEX "rds_search_facets_parent_id_idx" ON "rds_search_facets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rds_search_facets_locales_locale_parent_id_unique" ON "rds_search_facets_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_search_facets_order_idx" ON "_rds_v_version_search_facets" USING btree ("_order");
  CREATE INDEX "_rds_v_version_search_facets_parent_id_idx" ON "_rds_v_version_search_facets" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_search_facets_locales_locale_parent_id_unique" ON "_rds_v_version_search_facets_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "rds_search_facets" CASCADE;
  DROP TABLE "rds_search_facets_locales" CASCADE;
  DROP TABLE "_rds_v_version_search_facets" CASCADE;
  DROP TABLE "_rds_v_version_search_facets_locales" CASCADE;`)
}
