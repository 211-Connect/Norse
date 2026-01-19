import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'translate' BEFORE 'warmCache';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'translate' BEFORE 'warmCache';
  CREATE TABLE "rds_suggestions_locales" (
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_suggestions_locales" (
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );`);

  const createMappingsAndMigrate = sql`
  CREATE TEMP TABLE suggestion_en_mapping AS
  SELECT 
    s_all."id" as locale_id,
    s_all."_locale" as locale,
    s_all."value" as locale_value,
    s_en."id" as en_id
  FROM "rds_suggestions" s_all
  INNER JOIN "rds_suggestions" s_en 
    ON s_all."_parent_id" = s_en."_parent_id" 
    AND s_all."_order" = s_en."_order"
    AND s_en."_locale" = 'en';
  
  INSERT INTO "rds_suggestions_locales" ("value", "_locale", "_parent_id")
  SELECT locale_value, locale, en_id
  FROM suggestion_en_mapping;
  
  CREATE TEMP TABLE version_suggestion_en_mapping AS
  SELECT 
    s_all."id" as locale_id,
    s_all."_locale" as locale,
    s_all."value" as locale_value,
    s_en."id" as en_id
  FROM "_rds_v_version_suggestions" s_all
  INNER JOIN "_rds_v_version_suggestions" s_en 
    ON s_all."_parent_id" = s_en."_parent_id" 
    AND s_all."_order" = s_en."_order"
    AND s_en."_locale" = 'en';
  
  INSERT INTO "_rds_v_version_suggestions_locales" ("value", "_locale", "_parent_id")
  SELECT locale_value, locale, en_id
  FROM version_suggestion_en_mapping;
  `;

  await db.execute(createMappingsAndMigrate);

  await db.execute(sql`
  DELETE FROM "rds_suggestions" WHERE "_locale" != 'en';
  DELETE FROM "_rds_v_version_suggestions" WHERE "_locale" != 'en';
  `);

  await db.execute(sql`
  DROP INDEX "rds_suggestions_locale_idx";
  DROP INDEX "_rds_v_version_suggestions_locale_idx";
  ALTER TABLE "rds_suggestions_locales" ADD CONSTRAINT "rds_suggestions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_suggestions_locales" ADD CONSTRAINT "_rds_v_version_suggestions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "rds_suggestions_locales_locale_parent_id_unique" ON "rds_suggestions_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_suggestions_locales_locale_parent_id_unique" ON "_rds_v_version_suggestions_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "rds_suggestions" DROP COLUMN "_locale";
  ALTER TABLE "rds_suggestions" DROP COLUMN "value";
  ALTER TABLE "_rds_v_version_suggestions" DROP COLUMN "_locale";
  ALTER TABLE "_rds_v_version_suggestions" DROP COLUMN "value";`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_suggestions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_suggestions_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rds_suggestions_locales" CASCADE;
  DROP TABLE "_rds_v_version_suggestions_locales" CASCADE;
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translateTopics', 'warmCache');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translateTopics', 'warmCache');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "rds_suggestions" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "rds_suggestions" ADD COLUMN "value" varchar NOT NULL;
  ALTER TABLE "_rds_v_version_suggestions" ADD COLUMN "_locale" "_locales" NOT NULL;
  ALTER TABLE "_rds_v_version_suggestions" ADD COLUMN "value" varchar NOT NULL;
  CREATE INDEX "rds_suggestions_locale_idx" ON "rds_suggestions" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_suggestions_locale_idx" ON "_rds_v_version_suggestions" USING btree ("_locale");`);
}
