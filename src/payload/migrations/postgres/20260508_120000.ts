import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "tenants_common_umami_website_ids" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "website_id" varchar NOT NULL
   );

   CREATE INDEX IF NOT EXISTS "tenants_common_umami_website_ids_order_idx" ON "tenants_common_umami_website_ids" USING btree ("_order");
   CREATE INDEX IF NOT EXISTS "tenants_common_umami_website_ids_parent_id_idx" ON "tenants_common_umami_website_ids" USING btree ("_parent_id");

   DO $$ BEGIN
    ALTER TABLE "tenants_common_umami_website_ids"
      ADD CONSTRAINT "tenants_common_umami_website_ids_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
   EXCEPTION
    WHEN duplicate_object THEN null;
   END $$;

   INSERT INTO "tenants_common_umami_website_ids" ("_order", "_parent_id", "id", "website_id")
   SELECT
     1,
     t."id",
     t."id" || '-legacy-umami-website-id',
     t."common_umami_website_id"
   FROM "tenants" t
   WHERE t."common_umami_website_id" IS NOT NULL
     AND t."common_umami_website_id" <> ''
     AND NOT EXISTS (
       SELECT 1
       FROM "tenants_common_umami_website_ids" w
       WHERE w."_parent_id" = t."id"
         AND w."website_id" = t."common_umami_website_id"
     )
   ON CONFLICT ("id") DO NOTHING;

   ALTER TABLE "tenants" DROP COLUMN IF EXISTS "common_umami_website_id";
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "common_umami_website_id" varchar;

   UPDATE "tenants" t
   SET "common_umami_website_id" = w."website_id"
   FROM (
     SELECT DISTINCT ON ("_parent_id")
       "_parent_id",
       "website_id"
     FROM "tenants_common_umami_website_ids"
     ORDER BY "_parent_id", "_order" ASC
   ) w
   WHERE t."id" = w."_parent_id";

   DROP TABLE IF EXISTS "tenants_common_umami_website_ids" CASCADE;
  `);
}
