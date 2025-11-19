import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."_locales" ADD VALUE 'fil' BEFORE 'fr';
  ALTER TYPE "public"."enum_tenants_enabled_locales" ADD VALUE 'fil' BEFORE 'fr';
  ALTER TYPE "public"."enum_tenants_default_locale" ADD VALUE 'fil' BEFORE 'fr';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_common_alert" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_common_data_providers" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_header_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_footer_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_suggestions" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_topics_list_subtopics" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_topics_list" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_new_layout_callouts_options" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "rds_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_common_data_providers" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_header_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_footer_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_suggestions" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_topics_list" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ALTER COLUMN "_locale" SET DATA TYPE text;
  ALTER TABLE "_rds_v_locales" ALTER COLUMN "_locale" SET DATA TYPE text;
  DROP TYPE "public"."_locales";
  CREATE TYPE "public"."_locales" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  ALTER TABLE "rds_common_alert" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_common_data_providers" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_header_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_footer_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_suggestions" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_topics_list_subtopics" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_topics_list" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_new_layout_callouts_options" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "rds_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_common_data_providers" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_header_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_footer_custom_menu" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_suggestions" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_topics_list" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "_rds_v_locales" ALTER COLUMN "_locale" SET DATA TYPE "public"."_locales" USING "_locale"::"public"."_locales";
  ALTER TABLE "tenants_enabled_locales" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_tenants_enabled_locales";
  CREATE TYPE "public"."enum_tenants_enabled_locales" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  ALTER TABLE "tenants_enabled_locales" ALTER COLUMN "value" SET DATA TYPE "public"."enum_tenants_enabled_locales" USING "value"::"public"."enum_tenants_enabled_locales";
  ALTER TABLE "tenants" ALTER COLUMN "default_locale" SET DATA TYPE text;
  ALTER TABLE "tenants" ALTER COLUMN "default_locale" SET DEFAULT 'en'::text;
  DROP TYPE "public"."enum_tenants_default_locale";
  CREATE TYPE "public"."enum_tenants_default_locale" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  ALTER TABLE "tenants" ALTER COLUMN "default_locale" SET DEFAULT 'en'::"public"."enum_tenants_default_locale";
  ALTER TABLE "tenants" ALTER COLUMN "default_locale" SET DATA TYPE "public"."enum_tenants_default_locale" USING "default_locale"::"public"."enum_tenants_default_locale";`)
}
