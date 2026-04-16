import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tenants_auth_allowed_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  ALTER TABLE "tenants_auth_allowed_domains" ADD CONSTRAINT "tenants_auth_allowed_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_auth_allowed_domains_order_idx" ON "tenants_auth_allowed_domains" USING btree ("_order");
  CREATE INDEX "tenants_auth_allowed_domains_parent_id_idx" ON "tenants_auth_allowed_domains" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "tenants_auth_allowed_domains" CASCADE;`)
}
