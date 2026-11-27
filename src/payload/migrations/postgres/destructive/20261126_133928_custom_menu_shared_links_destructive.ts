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

/** Turns each locale's name back into its own row in the old table. */
function expandMenu({ from, to, versioned }: MenuTable): string {
  const id = versioned ? '' : ', id';
  const uuid = versioned ? ', _uuid' : '';
  return `
  INSERT INTO "${from}" (_order, _parent_id, _locale, name, href, open_in_new_tab${uuid}${id})
  SELECT t._order, t._parent_id, l._locale, l.name, t.href, t.open_in_new_tab${versioned ? ', t._uuid' : ''}${
    versioned
      ? ''
      : ", CASE WHEN l._locale = 'en' THEN t.id ELSE t.id || '_' || l._locale END"
  }
  FROM "${to}" t
  JOIN "${to}_locales" l ON l._parent_id = t.id
  WHERE l.name IS NOT NULL AND l.name <> ''
  ORDER BY t._parent_id, t._order;`;
}

/**
 * Run after the release of `20261126_133928_custom_menu_shared_links`: drops
 * the old per-locale custom menu tables. `down` recreates them and fills
 * them back from the shared menu, one row per locale that has a name.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "rds_header_custom_menu" CASCADE;

    DROP TABLE "rds_footer_custom_menu" CASCADE;

    DROP TABLE "_rds_v_version_header_custom_menu" CASCADE;

    DROP TABLE "_rds_v_version_footer_custom_menu" CASCADE;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "rds_header_custom_menu" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE
    );

    CREATE TABLE "rds_footer_custom_menu" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE
    );

    CREATE TABLE "_rds_v_version_header_custom_menu" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE,
      "_uuid" varchar
    );

    CREATE TABLE "_rds_v_version_footer_custom_menu" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_locale" "_locales" NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "href" varchar,
      "open_in_new_tab" boolean DEFAULT FALSE,
      "_uuid" varchar
    );
  `);

  for (const menu of MENU_TABLES) {
    await db.execute(sql.raw(expandMenu(menu)));
  }

  await db.execute(sql`
    ALTER TABLE "rds_header_custom_menu"
    ADD CONSTRAINT "rds_header_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "rds_footer_custom_menu"
    ADD CONSTRAINT "rds_footer_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_header_custom_menu"
    ADD CONSTRAINT "_rds_v_version_header_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_rds_v_version_footer_custom_menu"
    ADD CONSTRAINT "_rds_v_version_footer_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "rds_header_custom_menu_order_idx" ON "rds_header_custom_menu" USING btree ("_order");

    CREATE INDEX "rds_header_custom_menu_parent_id_idx" ON "rds_header_custom_menu" USING btree ("_parent_id");

    CREATE INDEX "rds_header_custom_menu_locale_idx" ON "rds_header_custom_menu" USING btree ("_locale");

    CREATE INDEX "rds_footer_custom_menu_order_idx" ON "rds_footer_custom_menu" USING btree ("_order");

    CREATE INDEX "rds_footer_custom_menu_parent_id_idx" ON "rds_footer_custom_menu" USING btree ("_parent_id");

    CREATE INDEX "rds_footer_custom_menu_locale_idx" ON "rds_footer_custom_menu" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_header_custom_menu_order_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_order");

    CREATE INDEX "_rds_v_version_header_custom_menu_parent_id_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_header_custom_menu_locale_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_locale");

    CREATE INDEX "_rds_v_version_footer_custom_menu_order_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_order");

    CREATE INDEX "_rds_v_version_footer_custom_menu_parent_id_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_parent_id");

    CREATE INDEX "_rds_v_version_footer_custom_menu_locale_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_locale");
  `);
}
