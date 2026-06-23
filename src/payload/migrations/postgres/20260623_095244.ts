import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_rds_search_facets_sort_by" AS ENUM('count', 'name', 'valueOrder');

    CREATE TYPE "public"."enum__rds_v_version_search_facets_sort_by" AS ENUM('count', 'name', 'valueOrder');

    CREATE TABLE "rds_search_facets_value_order" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar
    );

    CREATE TABLE "_rds_v_version_search_facets_value_order" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "rds_search_facets"
    ADD COLUMN "sort_by" "enum_rds_search_facets_sort_by" DEFAULT 'count';

    ALTER TABLE "_rds_v_version_search_facets"
    ADD COLUMN "sort_by" "enum__rds_v_version_search_facets_sort_by" DEFAULT 'count';

    ALTER TABLE "rds_search_facets_value_order"
    ADD CONSTRAINT "rds_search_facets_value_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_search_facets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_search_facets_value_order"
    ADD CONSTRAINT "_rds_v_version_search_facets_value_order_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_search_facets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_search_facets_value_order_order_idx" ON "rds_search_facets_value_order" USING btree ("_order");

    CREATE INDEX "rds_search_facets_value_order_parent_id_idx" ON "rds_search_facets_value_order" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_search_facets_value_order_order_idx" ON "_rds_v_version_search_facets_value_order" USING btree ("_order");

    CREATE INDEX "_rds_v_version_search_facets_value_order_parent_id_idx" ON "_rds_v_version_search_facets_value_order" USING btree ("_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_search_facets_value_order" CASCADE;

    DROP TABLE "_rds_v_version_search_facets_value_order" CASCADE;

    ALTER TABLE "rds_search_facets"
    DROP COLUMN "sort_by";

    ALTER TABLE "_rds_v_version_search_facets"
    DROP COLUMN "sort_by";

    DROP TYPE "public"."enum_rds_search_facets_sort_by";

    DROP TYPE "public"."enum__rds_v_version_search_facets_sort_by";
  `);
}
