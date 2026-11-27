import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/** Old per-locale table → new shared table (its names go to `<new>_locales`). */
const MENU_TABLES = [
  { from: 'rds_header_custom_menu', to: 'rds_header_menu', versioned: false },
  { from: 'rds_footer_custom_menu', to: 'rds_footer_menu', versioned: false },
  {
    from: '_rds_v_version_header_custom_menu',
    to: '_rds_header_menu_v',
    versioned: true,
  },
  {
    from: '_rds_v_version_footer_custom_menu',
    to: '_rds_footer_menu_v',
    versioned: true,
  },
] as const;

type MenuTable = (typeof MENU_TABLES)[number];

/**
 * Merges a directory's (or version's) per-locale rows into one row per link,
 * matched by href: the nth link with the same href in each locale is one
 * item. The English row's id, order and new-tab setting win; every locale's
 * name is kept. A link with no English row gets another locale's name
 * (Spanish first) as its English name, since the English name is required.
 * Items are ordered by their English position, then by their first position
 * in another locale.
 */
function copyMergedMenu({ from, to, versioned }: MenuTable): string {
  const merge = `"${to}_merge"`;
  const uuid = versioned ? ', _uuid' : '';
  return `
  CREATE TEMP TABLE ${merge} AS
  WITH ranked AS (
    SELECT id, _parent_id, _locale, _order, name, coalesce(href, '') AS href_key,
      row_number() OVER (
        PARTITION BY _parent_id, _locale, coalesce(href, '') ORDER BY _order, id
      ) AS rn
    FROM "${from}"
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

  INSERT INTO "${to}" (_order, _parent_id, id, href, open_in_new_tab${uuid})
  SELECT o.new_order, t._parent_id, t.id, t.href, t.open_in_new_tab${versioned ? ', t._uuid' : ''}
  FROM "${from}" t
  JOIN (
    SELECT survivor_id, row_number() OVER (
      PARTITION BY _parent_id
      ORDER BY coalesce(en_order, any_order), (en_order IS NULL), survivor_id
    ) AS new_order
    FROM (SELECT DISTINCT survivor_id, _parent_id, en_order, any_order FROM ${merge}) s
  ) o ON o.survivor_id = t.id;

  INSERT INTO "${to}_locales" (name, _locale, _parent_id)
  SELECT name, _locale, survivor_id FROM ${merge};

  INSERT INTO "${to}_locales" (name, _locale, _parent_id)
  SELECT DISTINCT ON (survivor_id) name, 'en', survivor_id
  FROM ${merge}
  WHERE survivor_id NOT IN (SELECT survivor_id FROM ${merge} WHERE _locale = 'en')
  ORDER BY survivor_id, (_locale = 'es') DESC, _locale::text;
  ${
    versioned
      ? `SELECT setval(pg_get_serial_sequence('"${to}"', 'id'), coalesce((SELECT max(id) FROM "${to}"), 0) + 1, false);`
      : ''
  }
  DROP TABLE ${merge};`;
}

/**
 * Header and footer custom menus move from one list per locale
 * (`rds_*_custom_menu`, `_rds_v_version_*_custom_menu`) to one shared list
 * with a localized name (`rds_*_menu` + `_locales`, `_rds_*_menu_v` +
 * `_locales`). See docs/custom-menu.md.
 *
 * Additive only: the new tables are filled from the old ones, which are left
 * as they are for the running release. They are dropped after release by
 * `destructive/20261126_133928_custom_menu_shared_links_destructive.ts`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_header_menu" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE
    );

    CREATE TABLE "rds_header_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "rds_footer_menu" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE
    );

    CREATE TABLE "rds_footer_menu_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );

    CREATE TABLE "_rds_header_menu_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE,
      "_uuid" varchar
    );

    CREATE TABLE "_rds_header_menu_v_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_rds_footer_menu_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE,
      "_uuid" varchar
    );

    CREATE TABLE "_rds_footer_menu_v_locales" (
      "name" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
  `);

  for (const menu of MENU_TABLES) {
    await db.execute(sql.raw(copyMergedMenu(menu)));
  }

  await db.execute(sql`
    ALTER TABLE "rds_header_menu"
    ADD CONSTRAINT "rds_header_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_header_menu_locales"
    ADD CONSTRAINT "rds_header_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_header_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_footer_menu"
    ADD CONSTRAINT "rds_footer_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_footer_menu_locales"
    ADD CONSTRAINT "rds_footer_menu_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_footer_menu" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_header_menu_v"
    ADD CONSTRAINT "_rds_header_menu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_header_menu_v_locales"
    ADD CONSTRAINT "_rds_header_menu_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_header_menu_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_footer_menu_v"
    ADD CONSTRAINT "_rds_footer_menu_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_footer_menu_v_locales"
    ADD CONSTRAINT "_rds_footer_menu_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_footer_menu_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_header_menu_order_idx" ON "rds_header_menu" USING btree ("_order");

    CREATE INDEX "rds_header_menu_parent_id_idx" ON "rds_header_menu" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "rds_header_menu_locales_locale_parent_id_unique" ON "rds_header_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "rds_header_menu_locales_parent_id_idx" ON "rds_header_menu_locales" USING btree ("_parent_id");

    CREATE INDEX "rds_footer_menu_order_idx" ON "rds_footer_menu" USING btree ("_order");

    CREATE INDEX "rds_footer_menu_parent_id_idx" ON "rds_footer_menu" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "rds_footer_menu_locales_locale_parent_id_unique" ON "rds_footer_menu_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "rds_footer_menu_locales_parent_id_idx" ON "rds_footer_menu_locales" USING btree ("_parent_id");

    CREATE INDEX "_rds_header_menu_v_order_idx" ON "_rds_header_menu_v" USING btree ("_order");

    CREATE INDEX "_rds_header_menu_v_parent_id_idx" ON "_rds_header_menu_v" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "_rds_header_menu_v_locales_locale_parent_id_unique" ON "_rds_header_menu_v_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_rds_header_menu_v_locales_parent_id_idx" ON "_rds_header_menu_v_locales" USING btree ("_parent_id");

    CREATE INDEX "_rds_footer_menu_v_order_idx" ON "_rds_footer_menu_v" USING btree ("_order");

    CREATE INDEX "_rds_footer_menu_v_parent_id_idx" ON "_rds_footer_menu_v" USING btree ("_parent_id");

    CREATE UNIQUE INDEX "_rds_footer_menu_v_locales_locale_parent_id_unique" ON "_rds_footer_menu_v_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_rds_footer_menu_v_locales_parent_id_idx" ON "_rds_footer_menu_v_locales" USING btree ("_parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_header_menu" CASCADE;

    DROP TABLE "rds_header_menu_locales" CASCADE;

    DROP TABLE "rds_footer_menu" CASCADE;

    DROP TABLE "rds_footer_menu_locales" CASCADE;

    DROP TABLE "_rds_header_menu_v" CASCADE;

    DROP TABLE "_rds_header_menu_v_locales" CASCADE;

    DROP TABLE "_rds_footer_menu_v" CASCADE;

    DROP TABLE "_rds_footer_menu_v_locales" CASCADE;
  `);
}
