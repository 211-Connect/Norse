import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_rds_topics_list_subtopics_query_type" ADD VALUE 'link';
  ALTER TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type" ADD VALUE 'link';
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::text;
  DROP TYPE "public"."enum_rds_common_alert_variant";
  CREATE TYPE "public"."enum_rds_common_alert_variant" AS ENUM('destructive', 'default');
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::"public"."enum_rds_common_alert_variant";
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_rds_common_alert_variant" USING "variant"::"public"."enum_rds_common_alert_variant";
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::text;
  DROP TYPE "public"."enum__rds_v_version_common_alert_variant";
  CREATE TYPE "public"."enum__rds_v_version_common_alert_variant" AS ENUM('destructive', 'default');
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::"public"."enum__rds_v_version_common_alert_variant";
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__rds_v_version_common_alert_variant" USING "variant"::"public"."enum__rds_v_version_common_alert_variant";
  ALTER TABLE "rds_locales" ALTER COLUMN "topics_custom_heading" SET DEFAULT 'Topics';
  ALTER TABLE "_rds_v_locales" ALTER COLUMN "version_topics_custom_heading" SET DEFAULT 'Topics';
  ALTER TABLE "rds_common_alert" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_common_data_providers" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_header_custom_menu" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_footer_custom_menu" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_topics_list_subtopics" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_topics_list" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_new_layout_callouts_options" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds" ADD COLUMN "header_safe_exit_open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_common_alert" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_common_data_providers" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_header_custom_menu" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_footer_custom_menu" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_topics_list" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD COLUMN "open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_header_safe_exit_open_in_new_tab" boolean DEFAULT false;
  ALTER TABLE "rds_header_custom_menu" DROP COLUMN "target";
  ALTER TABLE "rds_footer_custom_menu" DROP COLUMN "target";
  ALTER TABLE "rds_topics_list_subtopics" DROP COLUMN "target";
  ALTER TABLE "rds_topics_list" DROP COLUMN "target";
  ALTER TABLE "rds_new_layout_callouts_options" DROP COLUMN "url_target";
  ALTER TABLE "_rds_v_version_header_custom_menu" DROP COLUMN "target";
  ALTER TABLE "_rds_v_version_footer_custom_menu" DROP COLUMN "target";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" DROP COLUMN "target";
  ALTER TABLE "_rds_v_version_topics_list" DROP COLUMN "target";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" DROP COLUMN "url_target";
  DROP TYPE "public"."enum_rds_header_custom_menu_target";
  DROP TYPE "public"."enum_rds_footer_custom_menu_target";
  DROP TYPE "public"."enum_rds_topics_list_subtopics_target";
  DROP TYPE "public"."enum_rds_topics_list_target";
  DROP TYPE "public"."enum_rds_new_layout_callouts_options_url_target";
  DROP TYPE "public"."enum__rds_v_version_header_custom_menu_target";
  DROP TYPE "public"."enum__rds_v_version_footer_custom_menu_target";
  DROP TYPE "public"."enum__rds_v_version_topics_list_subtopics_target";
  DROP TYPE "public"."enum__rds_v_version_topics_list_target";
  DROP TYPE "public"."enum__rds_v_version_new_layout_callouts_options_url_target";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds_header_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_footer_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_topics_list_subtopics_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_topics_list_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_new_layout_callouts_options_url_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_header_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_footer_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_topics_list_subtopics_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_topics_list_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_new_layout_callouts_options_url_target" AS ENUM('_self', '_blank');
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::text;
  DROP TYPE "public"."enum_rds_common_alert_variant";
  CREATE TYPE "public"."enum_rds_common_alert_variant" AS ENUM('default', 'destructive');
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::"public"."enum_rds_common_alert_variant";
  ALTER TABLE "rds_common_alert" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_rds_common_alert_variant" USING "variant"::"public"."enum_rds_common_alert_variant";
  ALTER TABLE "rds_topics_list_subtopics" ALTER COLUMN "query_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_rds_topics_list_subtopics_query_type";
  CREATE TYPE "public"."enum_rds_topics_list_subtopics_query_type" AS ENUM('taxonomy', 'text');
  ALTER TABLE "rds_topics_list_subtopics" ALTER COLUMN "query_type" SET DATA TYPE "public"."enum_rds_topics_list_subtopics_query_type" USING "query_type"::"public"."enum_rds_topics_list_subtopics_query_type";
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DATA TYPE text;
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::text;
  DROP TYPE "public"."enum__rds_v_version_common_alert_variant";
  CREATE TYPE "public"."enum__rds_v_version_common_alert_variant" AS ENUM('default', 'destructive');
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DEFAULT 'destructive'::"public"."enum__rds_v_version_common_alert_variant";
  ALTER TABLE "_rds_v_version_common_alert" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__rds_v_version_common_alert_variant" USING "variant"::"public"."enum__rds_v_version_common_alert_variant";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ALTER COLUMN "query_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type";
  CREATE TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type" AS ENUM('taxonomy', 'text');
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ALTER COLUMN "query_type" SET DATA TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type" USING "query_type"::"public"."enum__rds_v_version_topics_list_subtopics_query_type";
  ALTER TABLE "rds_locales" ALTER COLUMN "topics_custom_heading" DROP DEFAULT;
  ALTER TABLE "_rds_v_locales" ALTER COLUMN "version_topics_custom_heading" DROP DEFAULT;
  ALTER TABLE "rds_header_custom_menu" ADD COLUMN "target" "enum_rds_header_custom_menu_target";
  ALTER TABLE "rds_footer_custom_menu" ADD COLUMN "target" "enum_rds_footer_custom_menu_target";
  ALTER TABLE "rds_topics_list_subtopics" ADD COLUMN "target" "enum_rds_topics_list_subtopics_target";
  ALTER TABLE "rds_topics_list" ADD COLUMN "target" "enum_rds_topics_list_target";
  ALTER TABLE "rds_new_layout_callouts_options" ADD COLUMN "url_target" "enum_rds_new_layout_callouts_options_url_target" DEFAULT '_self';
  ALTER TABLE "_rds_v_version_header_custom_menu" ADD COLUMN "target" "enum__rds_v_version_header_custom_menu_target";
  ALTER TABLE "_rds_v_version_footer_custom_menu" ADD COLUMN "target" "enum__rds_v_version_footer_custom_menu_target";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ADD COLUMN "target" "enum__rds_v_version_topics_list_subtopics_target";
  ALTER TABLE "_rds_v_version_topics_list" ADD COLUMN "target" "enum__rds_v_version_topics_list_target";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD COLUMN "url_target" "enum__rds_v_version_new_layout_callouts_options_url_target" DEFAULT '_self';
  ALTER TABLE "rds_common_alert" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_common_data_providers" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_header_custom_menu" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_footer_custom_menu" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_topics_list_subtopics" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_topics_list" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds_new_layout_callouts_options" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "rds" DROP COLUMN "header_safe_exit_open_in_new_tab";
  ALTER TABLE "_rds_v_version_common_alert" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_common_data_providers" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_header_custom_menu" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_footer_custom_menu" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_topics_list_subtopics" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_topics_list" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" DROP COLUMN "open_in_new_tab";
  ALTER TABLE "_rds_v" DROP COLUMN "version_header_safe_exit_open_in_new_tab";`)
}
