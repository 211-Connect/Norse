import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: Create new locale tables
  await db.execute(sql`
   CREATE TABLE "rds_topics_list_subtopics_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "rds_topics_list_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_topics_list_subtopics_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_topics_list_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );`);

  // Step 2: Migrate locale data - map all locale names to their English topic's ID
  // The challenge: Each locale has a different ID but same _parent_id and _order
  // We need to match them by _parent_id and _order, then use the English ID
  const createMappingsAndMigrate = sql`
  -- Create temp table to map locale topics to their English equivalent
  CREATE TEMP TABLE topic_en_mapping AS
  SELECT 
    t_all."id" as locale_id,
    t_all."_locale" as locale,
    t_all."name" as locale_name,
    t_en."id" as en_id
  FROM "rds_topics_list" t_all
  INNER JOIN "rds_topics_list" t_en 
    ON t_all."_parent_id" = t_en."_parent_id" 
    AND t_all."_order" = t_en."_order"
    AND t_en."_locale" = 'en';
  
  -- Migrate topics using the English ID as _parent_id
  INSERT INTO "rds_topics_list_locales" ("name", "_locale", "_parent_id")
  SELECT locale_name, locale, en_id
  FROM topic_en_mapping;
  
  -- Subtopics: They reference locale-specific topic IDs, so we need to:
  -- 1. Find the English topic for each subtopic's parent
  -- 2. Match subtopics by English parent + order
  -- 3. Migrate all locale names to the English subtopic's ID
  CREATE TEMP TABLE subtopic_en_mapping AS
  SELECT 
    st_all."id" as locale_id,
    st_all."_locale" as locale,
    st_all."name" as locale_name,
    st_en."id" as en_id
  FROM "rds_topics_list_subtopics" st_all
  -- Join to find the English topic for the non-English parent
  INNER JOIN "rds_topics_list" t_parent 
    ON st_all."_parent_id" = t_parent."id"
  INNER JOIN "rds_topics_list" t_parent_en
    ON t_parent."_parent_id" = t_parent_en."_parent_id"
    AND t_parent."_order" = t_parent_en."_order"
    AND t_parent_en."_locale" = 'en'
  -- Now match with English subtopic by same English parent + order
  INNER JOIN "rds_topics_list_subtopics" st_en 
    ON st_en."_parent_id" = t_parent_en."id"
    AND st_all."_order" = st_en."_order"
    AND st_en."_locale" = 'en';
  
  INSERT INTO "rds_topics_list_subtopics_locales" ("name", "_locale", "_parent_id")
  SELECT locale_name, locale, en_id
  FROM subtopic_en_mapping;
  
  -- Same for version tables
  CREATE TEMP TABLE version_topic_en_mapping AS
  SELECT 
    t_all."id" as locale_id,
    t_all."_locale" as locale,
    t_all."name" as locale_name,
    t_en."id" as en_id
  FROM "_rds_v_version_topics_list" t_all
  INNER JOIN "_rds_v_version_topics_list" t_en 
    ON t_all."_parent_id" = t_en."_parent_id" 
    AND t_all."_order" = t_en."_order"
    AND t_en."_locale" = 'en';
  
  INSERT INTO "_rds_v_version_topics_list_locales" ("name", "_locale", "_parent_id")
  SELECT locale_name, locale, en_id
  FROM version_topic_en_mapping;
  
  CREATE TEMP TABLE version_subtopic_en_mapping AS
  SELECT 
    st_all."id" as locale_id,
    st_all."_locale" as locale,
    st_all."name" as locale_name,
    st_en."id" as en_id
  FROM "_rds_v_version_topics_list_subtopics" st_all
  -- Join to find the English topic for the non-English parent
  INNER JOIN "_rds_v_version_topics_list" t_parent 
    ON st_all."_parent_id" = t_parent."id"
  INNER JOIN "_rds_v_version_topics_list" t_parent_en
    ON t_parent."_parent_id" = t_parent_en."_parent_id"
    AND t_parent."_order" = t_parent_en."_order"
    AND t_parent_en."_locale" = 'en'
  -- Now match with English subtopic by same English parent + order
  INNER JOIN "_rds_v_version_topics_list_subtopics" st_en 
    ON st_en."_parent_id" = t_parent_en."id"
    AND st_all."_order" = st_en."_order" 
    AND st_en."_locale" = 'en';
  
  INSERT INTO "_rds_v_version_topics_list_subtopics_locales" ("name", "_locale", "_parent_id")
  SELECT locale_name, locale, en_id
  FROM version_subtopic_en_mapping;
  `;

  await db.execute(createMappingsAndMigrate);

  // Step 3: Delete non-English rows from main tables
  await db.execute(sql`
  DELETE FROM "rds_topics_list_subtopics" WHERE "_locale" != 'en';
  DELETE FROM "rds_topics_list" WHERE "_locale" != 'en';
  DELETE FROM "_rds_v_version_topics_list_subtopics" WHERE "_locale" != 'en';
  DELETE FROM "_rds_v_version_topics_list" WHERE "_locale" != 'en';
  `);

  // Step 4: Add constraints and indexes, drop old columns
  await db.execute(sql`
  DROP INDEX "rds_topics_list_subtopics_locale_idx";
  DROP INDEX "rds_topics_list_locale_idx";
  DROP INDEX "_rds_v_version_topics_list_subtopics_locale_idx";
  DROP INDEX "_rds_v_version_topics_list_locale_idx";
  
  ALTER TABLE "rds_topics_list_subtopics_locales" ADD CONSTRAINT "rds_topics_list_subtopics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_topics_list_subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_topics_list_locales" ADD CONSTRAINT "rds_topics_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_topics_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_topics_list_subtopics_locales" ADD CONSTRAINT "_rds_v_version_topics_list_subtopics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_topics_list_subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_topics_list_locales" ADD CONSTRAINT "_rds_v_version_topics_list_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_topics_list"("id") ON DELETE cascade ON UPDATE no action;
  
  CREATE UNIQUE INDEX "rds_topics_list_subtopics_locales_locale_parent_id_unique" ON "rds_topics_list_subtopics_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "rds_topics_list_locales_locale_parent_id_unique" ON "rds_topics_list_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_topics_list_subtopics_locales_locale_parent_id_unique" ON "_rds_v_version_topics_list_subtopics_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_topics_list_locales_locale_parent_id_unique" ON "_rds_v_version_topics_list_locales" USING btree ("_locale","_parent_id");
  
  ALTER TABLE "rds_topics_list_subtopics" DROP COLUMN "_locale";
  ALTER TABLE "rds_topics_list_subtopics" DROP COLUMN "name";
  ALTER TABLE "rds_topics_list" DROP COLUMN "_locale";
  ALTER TABLE "rds_topics_list" DROP COLUMN "name";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" DROP COLUMN "_locale";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" DROP COLUMN "name";
  ALTER TABLE "_rds_v_version_topics_list" DROP COLUMN "_locale";
  ALTER TABLE "_rds_v_version_topics_list" DROP COLUMN "name";`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_topics_list_subtopics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rds_topics_list_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_topics_list_subtopics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_topics_list_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rds_topics_list_subtopics_locales" CASCADE;
  DROP TABLE "rds_topics_list_locales" CASCADE;
  DROP TABLE "_rds_v_version_topics_list_subtopics_locales" CASCADE;
  DROP TABLE "_rds_v_version_topics_list_locales" CASCADE;
  ALTER TABLE "rds_topics_list_subtopics" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "rds_topics_list_subtopics" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "rds_topics_list" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "rds_topics_list" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "_rds_v_version_topics_list" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_rds_v_version_topics_list" ADD COLUMN "name" varchar NOT NULL;
  CREATE INDEX "rds_topics_list_subtopics_locale_idx" ON "rds_topics_list_subtopics" USING btree ("_locale");
  CREATE INDEX "rds_topics_list_locale_idx" ON "rds_topics_list" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_topics_list_subtopics_locale_idx" ON "_rds_v_version_topics_list_subtopics" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_topics_list_locale_idx" ON "_rds_v_version_topics_list" USING btree ("_locale");`);
}
