import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Create new locale tables
  await db.execute(sql`
    CREATE TABLE "rds_common_alert_locales" (
      "text" varchar NOT NULL,
      "button_text" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "rds_new_layout_callouts_options_locales" (
      "description" varchar,
      "title" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "_rds_v_version_common_alert_locales" (
      "text" varchar NOT NULL,
      "button_text" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_rds_v_version_new_layout_callouts_options_locales" (
      "description" varchar,
      "title" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  // Step 2: Migrate locale data - map all locale entries to their English equivalent
  const migrateData = sql`
    -- Migrate common_alert: map all locale entries to their English equivalent
    CREATE TEMP TABLE alert_en_mapping AS
    SELECT
      alert_all."id" AS locale_id,
      alert_all."_locale" AS locale,
      alert_all."text" AS locale_text,
      alert_all."button_text" AS locale_button_text,
      alert_en."id" AS en_id
    FROM
      "rds_common_alert" alert_all
      INNER JOIN "rds_common_alert" alert_en ON alert_all."_parent_id" = alert_en."_parent_id"
      AND alert_all."_order" = alert_en."_order"
      AND alert_en."_locale" = 'en';

    INSERT INTO
      "rds_common_alert_locales" ("text", "button_text", "_locale", "_parent_id")
    SELECT
      locale_text,
      locale_button_text,
      locale,
      en_id
    FROM
      alert_en_mapping;

    -- Migrate callouts: map all locale entries to their English equivalent
    CREATE TEMP TABLE callouts_en_mapping AS
    SELECT
      callout_all."id" AS locale_id,
      callout_all."_locale" AS locale,
      callout_all."description" AS locale_description,
      callout_all."title" AS locale_title,
      callout_en."id" AS en_id
    FROM
      "rds_new_layout_callouts_options" callout_all
      INNER JOIN "rds_new_layout_callouts_options" callout_en ON callout_all."_parent_id" = callout_en."_parent_id"
      AND callout_all."_order" = callout_en."_order"
      AND callout_en."_locale" = 'en';

    INSERT INTO
      "rds_new_layout_callouts_options_locales" ("description", "title", "_locale", "_parent_id")
    SELECT
      locale_description,
      locale_title,
      locale,
      en_id
    FROM
      callouts_en_mapping;

    -- Migrate version tables
    CREATE TEMP TABLE version_alert_en_mapping AS
    SELECT
      alert_all."id" AS locale_id,
      alert_all."_locale" AS locale,
      alert_all."text" AS locale_text,
      alert_all."button_text" AS locale_button_text,
      alert_en."id" AS en_id
    FROM
      "_rds_v_version_common_alert" alert_all
      INNER JOIN "_rds_v_version_common_alert" alert_en ON alert_all."_parent_id" = alert_en."_parent_id"
      AND alert_all."_order" = alert_en."_order"
      AND alert_en."_locale" = 'en';

    INSERT INTO
      "_rds_v_version_common_alert_locales" ("text", "button_text", "_locale", "_parent_id")
    SELECT
      locale_text,
      locale_button_text,
      locale,
      en_id
    FROM
      version_alert_en_mapping;

    CREATE TEMP TABLE version_callouts_en_mapping AS
    SELECT
      callout_all."id" AS locale_id,
      callout_all."_locale" AS locale,
      callout_all."description" AS locale_description,
      callout_all."title" AS locale_title,
      callout_en."id" AS en_id
    FROM
      "_rds_v_version_new_layout_callouts_options" callout_all
      INNER JOIN "_rds_v_version_new_layout_callouts_options" callout_en ON callout_all."_parent_id" = callout_en."_parent_id"
      AND callout_all."_order" = callout_en."_order"
      AND callout_en."_locale" = 'en';

    INSERT INTO
      "_rds_v_version_new_layout_callouts_options_locales" ("description", "title", "_locale", "_parent_id")
    SELECT
      locale_description,
      locale_title,
      locale,
      en_id
    FROM
      version_callouts_en_mapping;
  `;

  await db.execute(migrateData);

  // Step 3: Delete non-English rows from main tables
  await db.execute(sql`
    DELETE FROM "rds_common_alert"
    WHERE
      "_locale" != 'en';

    DELETE FROM "rds_new_layout_callouts_options"
    WHERE
      "_locale" != 'en';

    DELETE FROM "_rds_v_version_common_alert"
    WHERE
      "_locale" != 'en';

    DELETE FROM "_rds_v_version_new_layout_callouts_options"
    WHERE
      "_locale" != 'en';
  `);

  await db.execute(sql`
    ALTER TABLE "rds_common_alert_locales"
    ADD CONSTRAINT "rds_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_common_alert" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_new_layout_callouts_options_locales"
    ADD CONSTRAINT "rds_new_layout_callouts_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_new_layout_callouts_options" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_common_alert_locales"
    ADD CONSTRAINT "_rds_v_version_common_alert_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_common_alert" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_new_layout_callouts_options_locales"
    ADD CONSTRAINT "_rds_v_version_new_layout_callouts_options_locales_parent_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_new_layout_callouts_options" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE UNIQUE INDEX "rds_common_alert_locales_locale_parent_id_unique" ON "rds_common_alert_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX "rds_new_layout_callouts_options_locales_locale_parent_id_uni" ON "rds_new_layout_callouts_options_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX "_rds_v_version_common_alert_locales_locale_parent_id_unique" ON "_rds_v_version_common_alert_locales" USING btree ("_locale", "_parent_id");

    CREATE UNIQUE INDEX "_rds_v_version_new_layout_callouts_options_locales_locale_pa" ON "_rds_v_version_new_layout_callouts_options_locales" USING btree ("_locale", "_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_common_alert_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "rds_new_layout_callouts_options_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_rds_v_version_common_alert_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_rds_v_version_new_layout_callouts_options_locales" DISABLE ROW LEVEL SECURITY;

    DROP TABLE "rds_common_alert_locales" CASCADE;

    DROP TABLE "rds_new_layout_callouts_options_locales" CASCADE;

    DROP TABLE "_rds_v_version_common_alert_locales" CASCADE;

    DROP TABLE "_rds_v_version_new_layout_callouts_options_locales" CASCADE;
  `);
}
