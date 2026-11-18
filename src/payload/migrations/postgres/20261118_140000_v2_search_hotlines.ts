import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

// Hand-written (no snapshot .json): adds the array table for the Search tab
// field `searchSettings.hotlines` and its versions table. Additive only.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_search_search_settings_hotlines" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "number" varchar NOT NULL
    );

    CREATE TABLE "_rds_v_version_search_search_settings_hotlines" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "number" varchar NOT NULL,
      "_uuid" varchar
    );

    ALTER TABLE "rds_search_search_settings_hotlines"
    ADD CONSTRAINT "rds_search_search_settings_hotlines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_search_search_settings_hotlines"
    ADD CONSTRAINT "_rds_v_version_search_search_settings_hotlines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_search_search_settings_hotlines_order_idx" ON "rds_search_search_settings_hotlines" USING btree ("_order");

    CREATE INDEX "rds_search_search_settings_hotlines_parent_id_idx" ON "rds_search_search_settings_hotlines" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_search_search_settings_hotlines_order_idx" ON "_rds_v_version_search_search_settings_hotlines" USING btree ("_order");

    CREATE INDEX "_rds_v_version_search_search_settings_hotlines_parent_id_idx" ON "_rds_v_version_search_search_settings_hotlines" USING btree ("_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_search_search_settings_hotlines" CASCADE;

    DROP TABLE "_rds_v_version_search_search_settings_hotlines" CASCADE;
  `);
}
