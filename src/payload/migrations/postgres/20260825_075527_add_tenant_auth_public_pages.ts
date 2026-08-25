import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_tenants_auth_public_pages" AS ENUM(
      'home',
      'search-results',
      'resource-detail',
      'favorites-list'
    );

    CREATE TABLE "tenants_auth_public_pages" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_tenants_auth_public_pages",
      "id" serial PRIMARY KEY NOT NULL
    );

    ALTER TABLE "tenants_auth_public_pages"
    ADD CONSTRAINT "tenants_auth_public_pages_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "tenants_auth_public_pages_order_idx" ON "tenants_auth_public_pages" USING btree ("order");

    CREATE INDEX "tenants_auth_public_pages_parent_idx" ON "tenants_auth_public_pages" USING btree ("parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "tenants_auth_public_pages" CASCADE;

    DROP TYPE "public"."enum_tenants_auth_public_pages";
  `);
}
