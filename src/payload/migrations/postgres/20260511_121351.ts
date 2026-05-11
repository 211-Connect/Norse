import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tenants_common_umami_website_ids" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"website_id" varchar NOT NULL
  );
  
  ALTER TABLE "analytics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_id_idx";
  ALTER TABLE "tenants_common_umami_website_ids" ADD CONSTRAINT "tenants_common_umami_website_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_common_umami_website_ids_order_idx" ON "tenants_common_umami_website_ids" USING btree ("_order");
  CREATE INDEX "tenants_common_umami_website_ids_parent_id_idx" ON "tenants_common_umami_website_ids" USING btree ("_parent_id");
  ALTER TABLE "tenants" DROP COLUMN "common_umami_website_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "analytics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tenants_common_umami_website_ids" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_common_umami_website_ids" CASCADE;
  ALTER TABLE "tenants" ADD COLUMN "common_umami_website_id" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_id" integer;
  CREATE INDEX "analytics_updated_at_idx" ON "analytics" USING btree ("updated_at");
  CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_fk" FOREIGN KEY ("analytics_id") REFERENCES "public"."analytics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_id");`)
}
