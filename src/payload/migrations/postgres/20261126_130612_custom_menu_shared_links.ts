import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Header and footer custom menus used to be a separate list per locale. Now
 * the links are shared and only each item's name is localized.
 *
 * `up` merges the per-locale rows of a directory (or version) into one row
 * per link, matched by href (the nth link with the same href in each locale
 * is the same item). The English row is kept when there is one; every
 * locale's name moves to the new `_locales` table. A link that had no English
 * row gets the name of another locale (Spanish first) as its English name,
 * since the English name is required. Order follows English, then the other
 * locales.
 *
 * `down` turns each locale's name back into its own row.
 */
const MENU_TABLES = [
  { table: 'rds_header_custom_menu', versioned: false },
  { table: 'rds_footer_custom_menu', versioned: false },
  { table: '_rds_v_version_header_custom_menu', versioned: true },
  { table: '_rds_v_version_footer_custom_menu', versioned: true },
] as const;

type MenuTable = (typeof MENU_TABLES)[number];

function mergeLocalizedRows({ table }: MenuTable): string {
  const merge = `"${table}_merge"`;
  return `
  CREATE TEMP TABLE ${merge} AS
  WITH ranked AS (
    SELECT id, _parent_id, _locale, _order, name, coalesce(href, '') AS href_key,
      row_number() OVER (
        PARTITION BY _parent_id, _locale, coalesce(href, '') ORDER BY _order, id
      ) AS rn
    FROM "${table}"
  )
  SELECT id, _parent_id, _locale, name,
    first_value(id) OVER (
      PARTITION BY _parent_id, href_key, rn
      ORDER BY (_locale = 'en') DESC, (_locale = 'es') DESC, _locale::text, _order
      ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS survivor_id,
    min(_order) FILTER (WHERE _locale = 'en') OVER (PARTITION BY _parent_id, href_key, rn) AS en_order,
    min(_order) OVER (PARTITION BY _parent_id, href_key, rn) AS any_order
  FROM ranked;

  INSERT INTO "${table}_locales" (name, _locale, _parent_id)
  SELECT name, _locale, survivor_id FROM ${merge};

  INSERT INTO "${table}_locales" (name, _locale, _parent_id)
  SELECT DISTINCT ON (survivor_id) name, 'en', survivor_id
  FROM ${merge}
  WHERE survivor_id NOT IN (SELECT survivor_id FROM ${merge} WHERE _locale = 'en')
  ORDER BY survivor_id, (_locale = 'es') DESC, _locale::text;

  UPDATE "${table}" t SET _order = o.new_order
  FROM (
    SELECT survivor_id, row_number() OVER (
      PARTITION BY _parent_id
      ORDER BY coalesce(en_order, any_order), (en_order IS NULL), survivor_id
    ) AS new_order
    FROM (SELECT DISTINCT survivor_id, _parent_id, en_order, any_order FROM ${merge}) s
  ) o
  WHERE t.id = o.survivor_id;

  DELETE FROM "${table}" t USING ${merge} m WHERE t.id = m.id AND m.id <> m.survivor_id;

  DROP TABLE ${merge};`;
}

function expandLocalizedRows({ table, versioned }: MenuTable): string {
  const newId = versioned ? '' : `, t.id || '_' || l._locale`;
  const idColumn = versioned ? '' : ', id';
  const uuid = versioned ? ', _uuid' : '';
  return `
  ALTER TABLE "${table}" ADD COLUMN "_locale" "_locales";
  ALTER TABLE "${table}" ADD COLUMN "name" varchar;

  UPDATE "${table}" t SET _locale = 'en', name = l.name
  FROM "${table}_locales" l
  WHERE l._parent_id = t.id AND l._locale = 'en';

  INSERT INTO "${table}" (_order, _parent_id, href, open_in_new_tab${uuid}, _locale, name${idColumn})
  SELECT t._order, t._parent_id, t.href, t.open_in_new_tab${versioned ? ', t._uuid' : ''}, l._locale, l.name${newId}
  FROM "${table}" t
  JOIN "${table}_locales" l ON l._parent_id = t.id AND l._locale <> 'en'
  WHERE t._locale = 'en' AND l.name IS NOT NULL;

  DELETE FROM "${table}" WHERE _locale IS NULL OR name IS NULL;
  ALTER TABLE "${table}" ALTER COLUMN "_locale" SET NOT NULL;
  ALTER TABLE "${table}" ALTER COLUMN "name" SET NOT NULL;`;
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_header_custom_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "rds_footer_custom_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "_rds_v_version_header_custom_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_rds_v_version_footer_custom_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  for (const menu of MENU_TABLES) {
    await db.execute(sql.raw(mergeLocalizedRows(menu)));
  }

  await db.execute(sql`
    DROP INDEX "rds_header_custom_menu_locale_idx";

    DROP INDEX "rds_footer_custom_menu_locale_idx";

    DROP INDEX "_rds_v_version_header_custom_menu_locale_idx";

    DROP INDEX "_rds_v_version_footer_custom_menu_locale_idx";

    ALTER TABLE "rds_header_custom_menu_locales"
    ADD CONSTRAINT "rds_header_custom_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_header_custom_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_footer_custom_menu_locales"
    ADD CONSTRAINT "rds_footer_custom_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_footer_custom_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_header_custom_menu_locales"
    ADD CONSTRAINT "_rds_v_version_header_custom_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_header_custom_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_footer_custom_menu_locales"
    ADD CONSTRAINT "_rds_v_version_footer_custom_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_footer_custom_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE UNIQUE INDEX "rds_header_custom_menu_locales_locale_parent_id_unique" ON "rds_header_custom_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "rds_header_custom_menu_locales_parent_id_idx" ON "rds_header_custom_menu_locales" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "rds_footer_custom_menu_locales_locale_parent_id_unique" ON "rds_footer_custom_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "rds_footer_custom_menu_locales_parent_id_idx" ON "rds_footer_custom_menu_locales" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "_rds_v_version_header_custom_menu_locales_locale_parent_id_u" ON "_rds_v_version_header_custom_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_rds_v_version_header_custom_menu_locales_parent_id_idx" ON "_rds_v_version_header_custom_menu_locales" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "_rds_v_version_footer_custom_menu_locales_locale_parent_id_u" ON "_rds_v_version_footer_custom_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_rds_v_version_footer_custom_menu_locales_parent_id_idx" ON "_rds_v_version_footer_custom_menu_locales" USING btree ("_parent_id");

    ALTER TABLE "rds_header_custom_menu"
    DROP COLUMN "_locale";

    ALTER TABLE "rds_header_custom_menu"
    DROP COLUMN "name";

    ALTER TABLE "rds_footer_custom_menu"
    DROP COLUMN "_locale";

    ALTER TABLE "rds_footer_custom_menu"
    DROP COLUMN "name";

    ALTER TABLE "_rds_v_version_header_custom_menu"
    DROP COLUMN "_locale";

    ALTER TABLE "_rds_v_version_header_custom_menu"
    DROP COLUMN "name";

    ALTER TABLE "_rds_v_version_footer_custom_menu"
    DROP COLUMN "_locale";

    ALTER TABLE "_rds_v_version_footer_custom_menu"
    DROP COLUMN "name";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  for (const menu of MENU_TABLES) {
    await db.execute(sql.raw(expandLocalizedRows(menu)));
  }

  await db.execute(sql`
    ALTER TABLE "rds_header_custom_menu_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "rds_footer_custom_menu_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_rds_v_version_header_custom_menu_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_rds_v_version_footer_custom_menu_locales" DISABLE ROW LEVEL SECURITY;

    DROP TABLE "rds_header_custom_menu_locales" CASCADE;

    DROP TABLE "rds_footer_custom_menu_locales" CASCADE;

    DROP TABLE "_rds_v_version_header_custom_menu_locales" CASCADE;

    DROP TABLE "_rds_v_version_footer_custom_menu_locales" CASCADE;

    CREATE INDEX "rds_header_custom_menu_locale_idx" ON "rds_header_custom_menu" USING btree ("_locale");

    CREATE INDEX "rds_footer_custom_menu_locale_idx" ON "rds_footer_custom_menu" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_header_custom_menu_locale_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_footer_custom_menu_locale_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_locale");
  `);
}
