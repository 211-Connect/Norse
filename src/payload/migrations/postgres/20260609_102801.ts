import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_search_facets_exclude_values" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE "_rds_v_version_search_facets_exclude_values" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL,
      "_uuid" varchar
    );

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_show_age_filter" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_show_age_filter" boolean DEFAULT FALSE;

    ALTER TABLE "rds_search_facets_exclude_values"
    ADD CONSTRAINT "rds_search_facets_exclude_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_search_facets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_search_facets_exclude_values"
    ADD CONSTRAINT "_rds_v_version_search_facets_exclude_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_search_facets" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_search_facets_exclude_values_order_idx" ON "rds_search_facets_exclude_values" USING btree ("_order");

    CREATE INDEX "rds_search_facets_exclude_values_parent_id_idx" ON "rds_search_facets_exclude_values" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_search_facets_exclude_values_order_idx" ON "_rds_v_version_search_facets_exclude_values" USING btree ("_order");

    CREATE INDEX "_rds_v_version_search_facets_exclude_values_parent_id_idx" ON "_rds_v_version_search_facets_exclude_values" USING btree ("_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_search_facets_exclude_values" CASCADE;

    DROP TABLE "_rds_v_version_search_facets_exclude_values" CASCADE;

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_show_age_filter";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_show_age_filter";
  `);
}
