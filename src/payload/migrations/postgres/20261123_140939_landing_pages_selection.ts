import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'generateLandingPages';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'generateLandingPages';
  ALTER TABLE "rds" ADD COLUMN "feature_flags_enable_landing_pages" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "landing_pages_regions" jsonb;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_enable_landing_pages" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_landing_pages_regions" jsonb;
  ALTER TABLE "lp_topics" ADD COLUMN "enabled" boolean DEFAULT true;
  ALTER TABLE "_lp_topics_v" ADD COLUMN "version_enabled" boolean DEFAULT true;
  CREATE INDEX "lp_topics_enabled_idx" ON "lp_topics" USING btree ("enabled");
  CREATE INDEX "_lp_topics_v_version_version_enabled_idx" ON "_lp_topics_v" USING btree ("version_enabled");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'deliverScheduledPdfs');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'deliverScheduledPdfs');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "lp_topics_enabled_idx";
  DROP INDEX "_lp_topics_v_version_version_enabled_idx";
  ALTER TABLE "rds" DROP COLUMN "feature_flags_enable_landing_pages";
  ALTER TABLE "rds" DROP COLUMN "landing_pages_regions";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_enable_landing_pages";
  ALTER TABLE "_rds_v" DROP COLUMN "version_landing_pages_regions";
  ALTER TABLE "lp_topics" DROP COLUMN "enabled";
  ALTER TABLE "_lp_topics_v" DROP COLUMN "version_enabled";`)
}
