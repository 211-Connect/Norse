import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "tenants_common_umami_website_ids" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"website_id" varchar NOT NULL
  );
  
  ALTER TABLE "tenants_common_umami_website_ids" ADD CONSTRAINT "tenants_common_umami_website_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tenants_common_umami_website_ids_order_idx" ON "tenants_common_umami_website_ids" USING btree ("_order");
  CREATE INDEX "tenants_common_umami_website_ids_parent_id_idx" ON "tenants_common_umami_website_ids" USING btree ("_parent_id");
  INSERT INTO "tenants_common_umami_website_ids" ("_order", "_parent_id", "id", "website_id")
  SELECT
    1,
    t."id",
    t."id" || '-legacy-umami-website-id',
    t."common_umami_website_id"
  FROM "tenants" t
  WHERE t."common_umami_website_id" IS NOT NULL
    AND t."common_umami_website_id" <> ''
  ON CONFLICT ("id") DO NOTHING;
  INSERT INTO "tenants_common_umami_website_ids" ("_order", "_parent_id", "id", "website_id")
  SELECT
    1,
    t."id",
    t."id" || '-legacy-umami-website-id',
    t."common_umami_website_id"
  FROM "tenants" t
  WHERE t."common_umami_website_id" IS NOT NULL
    AND t."common_umami_website_id" <> ''
  ON CONFLICT ("id") DO NOTHING;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "tenants_common_umami_website_ids" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "tenants_common_umami_website_ids" CASCADE;
  `)
}
