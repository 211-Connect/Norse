import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds__translationmeta_translated_by" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_rds__translationmeta_engine" AS ENUM('azure', 'google');
  CREATE TYPE "public"."enum__rds_v_version__translationmeta_translated_by" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum__rds_v_version__translationmeta_engine" AS ENUM('azure', 'google');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translateTopics');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translateTopics');
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "rds" ADD COLUMN "_translationmeta_last_translated_at" timestamp(3) with time zone;
  ALTER TABLE "rds" ADD COLUMN "_translationmeta_translated_by" "enum_rds__translationmeta_translated_by";
  ALTER TABLE "rds" ADD COLUMN "_translationmeta_engine" "enum_rds__translationmeta_engine";
  ALTER TABLE "_rds_v" ADD COLUMN "version__translationmeta_last_translated_at" timestamp(3) with time zone;
  ALTER TABLE "_rds_v" ADD COLUMN "version__translationmeta_translated_by" "enum__rds_v_version__translationmeta_translated_by";
  ALTER TABLE "_rds_v" ADD COLUMN "version__translationmeta_engine" "enum__rds_v_version__translationmeta_engine";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_jobs_id" integer;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk" FOREIGN KEY ("payload_jobs_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_payload_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_jobs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk";
  
  DROP INDEX "payload_locked_documents_rels_payload_jobs_id_idx";
  ALTER TABLE "rds" DROP COLUMN "_translationmeta_last_translated_at";
  ALTER TABLE "rds" DROP COLUMN "_translationmeta_translated_by";
  ALTER TABLE "rds" DROP COLUMN "_translationmeta_engine";
  ALTER TABLE "_rds_v" DROP COLUMN "version__translationmeta_last_translated_at";
  ALTER TABLE "_rds_v" DROP COLUMN "version__translationmeta_translated_by";
  ALTER TABLE "_rds_v" DROP COLUMN "version__translationmeta_engine";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_jobs_id";
  DROP TYPE "public"."enum_rds__translationmeta_translated_by";
  DROP TYPE "public"."enum_rds__translationmeta_engine";
  DROP TYPE "public"."enum__rds_v_version__translationmeta_translated_by";
  DROP TYPE "public"."enum__rds_v_version__translationmeta_engine";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
