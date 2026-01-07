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

  // Step 2: Delete duplicate rows (non-'en' locale rows) FIRST
  await db.execute(sql`
  -- Delete non-English subtopics
  DELETE FROM "rds_topics_list_subtopics"
  WHERE "_locale" != 'en';
  
  -- Delete non-English topics
  DELETE FROM "rds_topics_list"
  WHERE "_locale" != 'en';
  
  -- Delete non-English version subtopics
  DELETE FROM "_rds_v_version_topics_list_subtopics"
  WHERE "_locale" != 'en';
  
  -- Delete non-English version topics
  DELETE FROM "_rds_v_version_topics_list"
  WHERE "_locale" != 'en';
  `);

  // Step 3: Migrate data from old structure to new structure (only 'en' locale now remains)
  await db.execute(sql`
  -- Migrate main topics list data (only English rows remain)
  INSERT INTO "rds_topics_list_locales" ("name", "_locale", "_parent_id")
  SELECT "name", "_locale", "id"
  FROM "rds_topics_list";
  
  -- Migrate subtopics data
  INSERT INTO "rds_topics_list_subtopics_locales" ("name", "_locale", "_parent_id")
  SELECT "name", "_locale", "id"
  FROM "rds_topics_list_subtopics";
  
  -- Migrate version topics list data
  INSERT INTO "_rds_v_version_topics_list_locales" ("name", "_locale", "_parent_id")
  SELECT "name", "_locale", "id"
  FROM "_rds_v_version_topics_list";
  
  -- Migrate version subtopics data
  INSERT INTO "_rds_v_version_topics_list_subtopics_locales" ("name", "_locale", "_parent_id")
  SELECT "name", "_locale", "id"
  FROM "_rds_v_version_topics_list_subtopics";
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
