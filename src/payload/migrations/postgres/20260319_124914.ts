import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "analytics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_id" integer;
  CREATE INDEX "analytics_updated_at_idx" ON "analytics" USING btree ("updated_at");
  CREATE INDEX "analytics_created_at_idx" ON "analytics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_fk" FOREIGN KEY ("analytics_id") REFERENCES "public"."analytics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_analytics_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "analytics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "analytics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_fk";
  
  DROP INDEX "payload_locked_documents_rels_analytics_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_id";`)
}
