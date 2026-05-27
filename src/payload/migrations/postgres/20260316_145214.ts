import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_highlights_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_id" integer,
      "button_url" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE
    );

    CREATE TABLE "rds_highlights_items_locales" (
      "title" varchar NOT NULL,
      "description" varchar,
      "button_text" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "_rds_v_version_highlights_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "image_id" integer,
      "button_url" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE,
      "_uuid" varchar
    );

    CREATE TABLE "_rds_v_version_highlights_items_locales" (
      "title" varchar NOT NULL,
      "description" varchar,
      "button_text" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    ALTER TABLE "rds"
    ADD COLUMN "highlights_enable_carousel_autoplay" boolean DEFAULT FALSE;

    ALTER TABLE "rds"
    ADD COLUMN "highlights_autoplay_interval" numeric DEFAULT 5;

    ALTER TABLE "rds_locales"
    ADD COLUMN "highlights_section_title" varchar DEFAULT 'Featured Resources and News';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_highlights_enable_carousel_autoplay" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_highlights_autoplay_interval" numeric DEFAULT 5;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_highlights_section_title" varchar DEFAULT 'Featured Resources and News';

    ALTER TABLE "rds_highlights_items"
    ADD CONSTRAINT "rds_highlights_items_image_id_tenant_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tenant_media" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "rds_highlights_items"
    ADD CONSTRAINT "rds_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_highlights_items_locales"
    ADD CONSTRAINT "rds_highlights_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_highlights_items" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_highlights_items"
    ADD CONSTRAINT "_rds_v_version_highlights_items_image_id_tenant_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tenant_media" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_highlights_items"
    ADD CONSTRAINT "_rds_v_version_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_highlights_items_locales"
    ADD CONSTRAINT "_rds_v_version_highlights_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_highlights_items" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_highlights_items_order_idx" ON "rds_highlights_items" USING btree ("_order");

    CREATE INDEX "rds_highlights_items_parent_id_idx" ON "rds_highlights_items" USING btree ("_parent_id");

    CREATE INDEX "rds_highlights_items_image_idx" ON "rds_highlights_items" USING btree ("image_id");

    CREATE UNIQUE INDEX "rds_highlights_items_locales_locale_parent_id_unique" ON "rds_highlights_items_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_rds_v_version_highlights_items_order_idx" ON "_rds_v_version_highlights_items" USING btree ("_order");

    CREATE INDEX "_rds_v_version_highlights_items_parent_id_idx" ON "_rds_v_version_highlights_items" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_highlights_items_image_idx" ON "_rds_v_version_highlights_items" USING btree ("image_id");

    CREATE UNIQUE INDEX "_rds_v_version_highlights_items_locales_locale_parent_id_uni" ON "_rds_v_version_highlights_items_locales" USING btree ("_locale", "_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_highlights_items" CASCADE;

    DROP TABLE "rds_highlights_items_locales" CASCADE;

    DROP TABLE "_rds_v_version_highlights_items" CASCADE;

    DROP TABLE "_rds_v_version_highlights_items_locales" CASCADE;

    ALTER TABLE "rds"
    DROP COLUMN "highlights_enable_carousel_autoplay";

    ALTER TABLE "rds"
    DROP COLUMN "highlights_autoplay_interval";

    ALTER TABLE "rds_locales"
    DROP COLUMN "highlights_section_title";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_highlights_enable_carousel_autoplay";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_highlights_autoplay_interval";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_highlights_section_title";
  `);
}
