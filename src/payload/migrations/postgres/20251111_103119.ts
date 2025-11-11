import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('super-admin', 'support', 'tenant');
  CREATE TYPE "public"."enum_users_tenants_roles" AS ENUM('tenant-admin', 'tenant-editor');
  CREATE TYPE "public"."enum_tenants_enabled_locales" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  CREATE TYPE "public"."enum_tenants_default_locale" AS ENUM('am', 'ar', 'de', 'en', 'es', 'fi', 'fr', 'hi', 'hr', 'ht', 'ko', 'ne', 'pl', 'ru', 'so', 'sw', 'uk', 'vi', 'yue', 'zh-Hans', 'zh-Hant');
  CREATE TYPE "public"."enum_rds_common_alert_variant" AS ENUM('default', 'destructive');
  CREATE TYPE "public"."enum_rds_header_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_footer_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_topics_list_subtopics_query_type" AS ENUM('taxonomy', 'text');
  CREATE TYPE "public"."enum_rds_topics_list_subtopics_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_topics_list_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_new_layout_callouts_options_type" AS ENUM('Call', 'SMS', 'Chat', 'Email');
  CREATE TYPE "public"."enum_rds_new_layout_callouts_options_url_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum_rds_common_sms_provider" AS ENUM('Twilio');
  CREATE TYPE "public"."enum_rds_topics_icon_size" AS ENUM('small', 'medium');
  CREATE TYPE "public"."enum__rds_v_version_common_alert_variant" AS ENUM('default', 'destructive');
  CREATE TYPE "public"."enum__rds_v_version_header_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_footer_custom_menu_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type" AS ENUM('taxonomy', 'text');
  CREATE TYPE "public"."enum__rds_v_version_topics_list_subtopics_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_topics_list_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_new_layout_callouts_options_type" AS ENUM('Call', 'SMS', 'Chat', 'Email');
  CREATE TYPE "public"."enum__rds_v_version_new_layout_callouts_options_url_target" AS ENUM('_self', '_blank');
  CREATE TYPE "public"."enum__rds_v_version_common_sms_provider" AS ENUM('Twilio');
  CREATE TYPE "public"."enum__rds_v_version_topics_icon_size" AS ENUM('small', 'medium');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_tenants_roles" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_users_tenants_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_tenants" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" varchar
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "tenants_trusted_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE "tenants_enabled_locales" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_tenants_enabled_locales",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "tenants" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"default_locale" "enum_tenants_default_locale" DEFAULT 'en' NOT NULL,
  	"services_resource_directory" boolean DEFAULT false,
  	"auth_realm_id" varchar NOT NULL,
  	"auth_keycloak_secret" varchar,
  	"auth_keycloak_issuer" varchar,
  	"auth_next_auth_secret" varchar,
  	"common_gtm_container_id" varchar,
  	"common_matomo_container_url" varchar,
  	"twilio_phone_number" varchar,
  	"twilio_api_key" varchar,
  	"twilio_api_key_sid" varchar,
  	"twilio_account_sid" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tenant_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tenant_id" varchar,
  	"prefix" varchar DEFAULT 'tenant-id-placeholder',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar
  );
  
  CREATE TABLE "rds_common_alert" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"button_text" varchar,
  	"url" varchar,
  	"variant" "enum_rds_common_alert_variant" DEFAULT 'destructive'
  );
  
  CREATE TABLE "rds_common_data_providers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"logo_id" integer
  );
  
  CREATE TABLE "rds_header_custom_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"href" varchar,
  	"target" "enum_rds_header_custom_menu_target"
  );
  
  CREATE TABLE "rds_footer_custom_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"href" varchar,
  	"target" "enum_rds_footer_custom_menu_target"
  );
  
  CREATE TABLE "rds_suggestions" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"taxonomies" varchar NOT NULL
  );
  
  CREATE TABLE "rds_topics_list_subtopics" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"query_type" "enum_rds_topics_list_subtopics_query_type",
  	"query" varchar,
  	"href" varchar,
  	"target" "enum_rds_topics_list_subtopics_target"
  );
  
  CREATE TABLE "rds_topics_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer,
  	"href" varchar,
  	"target" "enum_rds_topics_list_target"
  );
  
  CREATE TABLE "rds_search_search_settings_radius_select_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric NOT NULL
  );
  
  CREATE TABLE "rds_new_layout_callouts_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_rds_new_layout_callouts_options_type" NOT NULL,
  	"custom_img_id" integer,
  	"description" varchar,
  	"title" varchar,
  	"url" varchar,
  	"url_target" "enum_rds_new_layout_callouts_options_url_target" DEFAULT '_self'
  );
  
  CREATE TABLE "rds" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" varchar,
  	"name" varchar NOT NULL,
  	"common_sms_provider" "enum_rds_common_sms_provider",
  	"brand_logo_id" integer NOT NULL,
  	"brand_favicon_id" integer NOT NULL,
  	"brand_hero_id" integer,
  	"brand_open_graph_id" integer,
  	"brand_copyright" varchar,
  	"brand_feedback_url" varchar,
  	"brand_phone_number" varchar,
  	"brand_theme_primary_color" varchar NOT NULL,
  	"brand_theme_secondary_color" varchar NOT NULL,
  	"brand_theme_border_radius" varchar NOT NULL,
  	"topics_icon_size" "enum_rds_topics_icon_size" DEFAULT 'small',
  	"search_search_settings_results_limit" numeric DEFAULT 25 NOT NULL,
  	"search_search_settings_default_radius" numeric,
  	"search_map_center" varchar NOT NULL,
  	"search_map_zoom" numeric NOT NULL,
  	"new_layout_enabled" boolean DEFAULT false,
  	"new_layout_header_start" varchar DEFAULT '',
  	"new_layout_header_end" varchar DEFAULT '',
  	"new_layout_hero_id" integer,
  	"new_layout_logo_id" integer,
  	"privacy_policy_page_enabled" boolean,
  	"privacy_policy_page_title" varchar,
  	"privacy_policy_page_content" varchar,
  	"terms_of_use_page_enabled" boolean,
  	"terms_of_use_page_title" varchar,
  	"terms_of_use_page_content" varchar,
  	"feature_flags_hide_categories_heading" boolean DEFAULT false,
  	"feature_flags_hide_data_providers_heading" boolean DEFAULT false,
  	"feature_flags_show_resource_categories" boolean DEFAULT false,
  	"feature_flags_show_home_page_tour" boolean DEFAULT false,
  	"feature_flags_require_user_location" boolean DEFAULT false,
  	"feature_flags_show_resource_last_assured_date" boolean DEFAULT false,
  	"feature_flags_show_search_and_resource_service_name" boolean DEFAULT false,
  	"feature_flags_show_suggestion_list_taxonomy_badge" boolean DEFAULT false,
  	"feature_flags_show_use_my_location_button_on_desktop" boolean DEFAULT false,
  	"feature_flags_show_print_button" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rds_locales" (
  	"common_custom_data_providers_heading" varchar,
  	"brand_meta_title" varchar,
  	"brand_meta_description" varchar,
  	"header_custom_home_url" varchar,
  	"header_search_url" varchar,
  	"header_safe_exit_enabled" boolean DEFAULT false,
  	"header_safe_exit_url" varchar,
  	"header_safe_exit_text" varchar,
  	"footer_disclaimer" varchar,
  	"topics_back_text" varchar,
  	"topics_custom_heading" varchar,
  	"resource_last_assured_text" varchar,
  	"search_texts_title" varchar,
  	"search_texts_query_input_placeholder" varchar,
  	"search_texts_location_input_placeholder" varchar,
  	"search_texts_no_results_fallback_text" varchar,
  	"new_layout_callouts_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_common_alert" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"button_text" varchar,
  	"url" varchar,
  	"variant" "enum__rds_v_version_common_alert_variant" DEFAULT 'destructive',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_common_data_providers" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"logo_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_header_custom_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"href" varchar,
  	"target" "enum__rds_v_version_header_custom_menu_target",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_footer_custom_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"href" varchar,
  	"target" "enum__rds_v_version_footer_custom_menu_target",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_suggestions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"taxonomies" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_topics_list_subtopics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"query_type" "enum__rds_v_version_topics_list_subtopics_query_type",
  	"query" varchar,
  	"href" varchar,
  	"target" "enum__rds_v_version_topics_list_subtopics_target",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_topics_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"image_id" integer,
  	"href" varchar,
  	"target" "enum__rds_v_version_topics_list_target",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_search_search_settings_radius_select_values" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" numeric NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_new_layout_callouts_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__rds_v_version_new_layout_callouts_options_type" NOT NULL,
  	"custom_img_id" integer,
  	"description" varchar,
  	"title" varchar,
  	"url" varchar,
  	"url_target" "enum__rds_v_version_new_layout_callouts_options_url_target" DEFAULT '_self',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_tenant_id" varchar,
  	"version_name" varchar NOT NULL,
  	"version_common_sms_provider" "enum__rds_v_version_common_sms_provider",
  	"version_brand_logo_id" integer NOT NULL,
  	"version_brand_favicon_id" integer NOT NULL,
  	"version_brand_hero_id" integer,
  	"version_brand_open_graph_id" integer,
  	"version_brand_copyright" varchar,
  	"version_brand_feedback_url" varchar,
  	"version_brand_phone_number" varchar,
  	"version_brand_theme_primary_color" varchar NOT NULL,
  	"version_brand_theme_secondary_color" varchar NOT NULL,
  	"version_brand_theme_border_radius" varchar NOT NULL,
  	"version_topics_icon_size" "enum__rds_v_version_topics_icon_size" DEFAULT 'small',
  	"version_search_search_settings_results_limit" numeric DEFAULT 25 NOT NULL,
  	"version_search_search_settings_default_radius" numeric,
  	"version_search_map_center" varchar NOT NULL,
  	"version_search_map_zoom" numeric NOT NULL,
  	"version_new_layout_enabled" boolean DEFAULT false,
  	"version_new_layout_header_start" varchar DEFAULT '',
  	"version_new_layout_header_end" varchar DEFAULT '',
  	"version_new_layout_hero_id" integer,
  	"version_new_layout_logo_id" integer,
  	"version_privacy_policy_page_enabled" boolean,
  	"version_privacy_policy_page_title" varchar,
  	"version_privacy_policy_page_content" varchar,
  	"version_terms_of_use_page_enabled" boolean,
  	"version_terms_of_use_page_title" varchar,
  	"version_terms_of_use_page_content" varchar,
  	"version_feature_flags_hide_categories_heading" boolean DEFAULT false,
  	"version_feature_flags_hide_data_providers_heading" boolean DEFAULT false,
  	"version_feature_flags_show_resource_categories" boolean DEFAULT false,
  	"version_feature_flags_show_home_page_tour" boolean DEFAULT false,
  	"version_feature_flags_require_user_location" boolean DEFAULT false,
  	"version_feature_flags_show_resource_last_assured_date" boolean DEFAULT false,
  	"version_feature_flags_show_search_and_resource_service_name" boolean DEFAULT false,
  	"version_feature_flags_show_suggestion_list_taxonomy_badge" boolean DEFAULT false,
  	"version_feature_flags_show_use_my_location_button_on_desktop" boolean DEFAULT false,
  	"version_feature_flags_show_print_button" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_rds_v_locales" (
  	"version_common_custom_data_providers_heading" varchar,
  	"version_brand_meta_title" varchar,
  	"version_brand_meta_description" varchar,
  	"version_header_custom_home_url" varchar,
  	"version_header_search_url" varchar,
  	"version_header_safe_exit_enabled" boolean DEFAULT false,
  	"version_header_safe_exit_url" varchar,
  	"version_header_safe_exit_text" varchar,
  	"version_footer_disclaimer" varchar,
  	"version_topics_back_text" varchar,
  	"version_topics_custom_heading" varchar,
  	"version_resource_last_assured_text" varchar,
  	"version_search_texts_title" varchar,
  	"version_search_texts_query_input_placeholder" varchar,
  	"version_search_texts_location_input_placeholder" varchar,
  	"version_search_texts_no_results_fallback_text" varchar,
  	"version_new_layout_callouts_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"tenants_id" varchar,
  	"tenant_media_id" integer,
  	"rds_id" varchar
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_tenants_roles" ADD CONSTRAINT "users_tenants_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users_tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_tenants" ADD CONSTRAINT "users_tenants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tenants_trusted_domains" ADD CONSTRAINT "tenants_trusted_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tenants_enabled_locales" ADD CONSTRAINT "tenants_enabled_locales_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tenant_media" ADD CONSTRAINT "tenant_media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds_common_alert" ADD CONSTRAINT "rds_common_alert_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_common_data_providers" ADD CONSTRAINT "rds_common_data_providers_logo_id_tenant_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds_common_data_providers" ADD CONSTRAINT "rds_common_data_providers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_header_custom_menu" ADD CONSTRAINT "rds_header_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_footer_custom_menu" ADD CONSTRAINT "rds_footer_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_suggestions" ADD CONSTRAINT "rds_suggestions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_topics_list_subtopics" ADD CONSTRAINT "rds_topics_list_subtopics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_topics_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_topics_list" ADD CONSTRAINT "rds_topics_list_image_id_tenant_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds_topics_list" ADD CONSTRAINT "rds_topics_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_search_search_settings_radius_select_values" ADD CONSTRAINT "rds_search_search_settings_radius_select_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_new_layout_callouts_options" ADD CONSTRAINT "rds_new_layout_callouts_options_custom_img_id_tenant_media_id_fk" FOREIGN KEY ("custom_img_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds_new_layout_callouts_options" ADD CONSTRAINT "rds_new_layout_callouts_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_brand_logo_id_tenant_media_id_fk" FOREIGN KEY ("brand_logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_brand_favicon_id_tenant_media_id_fk" FOREIGN KEY ("brand_favicon_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_brand_hero_id_tenant_media_id_fk" FOREIGN KEY ("brand_hero_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_brand_open_graph_id_tenant_media_id_fk" FOREIGN KEY ("brand_open_graph_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_new_layout_hero_id_tenant_media_id_fk" FOREIGN KEY ("new_layout_hero_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds" ADD CONSTRAINT "rds_new_layout_logo_id_tenant_media_id_fk" FOREIGN KEY ("new_layout_logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rds_locales" ADD CONSTRAINT "rds_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_common_alert" ADD CONSTRAINT "_rds_v_version_common_alert_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_common_data_providers" ADD CONSTRAINT "_rds_v_version_common_data_providers_logo_id_tenant_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v_version_common_data_providers" ADD CONSTRAINT "_rds_v_version_common_data_providers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_header_custom_menu" ADD CONSTRAINT "_rds_v_version_header_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_footer_custom_menu" ADD CONSTRAINT "_rds_v_version_footer_custom_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_suggestions" ADD CONSTRAINT "_rds_v_version_suggestions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_topics_list_subtopics" ADD CONSTRAINT "_rds_v_version_topics_list_subtopics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_topics_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_topics_list" ADD CONSTRAINT "_rds_v_version_topics_list_image_id_tenant_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v_version_topics_list" ADD CONSTRAINT "_rds_v_version_topics_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_search_search_settings_radius_select_values" ADD CONSTRAINT "_rds_v_version_search_search_settings_radius_select_values_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD CONSTRAINT "_rds_v_version_new_layout_callouts_options_custom_img_id_tenant_media_id_fk" FOREIGN KEY ("custom_img_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v_version_new_layout_callouts_options" ADD CONSTRAINT "_rds_v_version_new_layout_callouts_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_parent_id_rds_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."rds"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_brand_logo_id_tenant_media_id_fk" FOREIGN KEY ("version_brand_logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_brand_favicon_id_tenant_media_id_fk" FOREIGN KEY ("version_brand_favicon_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_brand_hero_id_tenant_media_id_fk" FOREIGN KEY ("version_brand_hero_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_brand_open_graph_id_tenant_media_id_fk" FOREIGN KEY ("version_brand_open_graph_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_new_layout_hero_id_tenant_media_id_fk" FOREIGN KEY ("version_new_layout_hero_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v" ADD CONSTRAINT "_rds_v_version_new_layout_logo_id_tenant_media_id_fk" FOREIGN KEY ("version_new_layout_logo_id") REFERENCES "public"."tenant_media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_rds_v_locales" ADD CONSTRAINT "_rds_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenants_fk" FOREIGN KEY ("tenants_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tenant_media_fk" FOREIGN KEY ("tenant_media_id") REFERENCES "public"."tenant_media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_directories_fk" FOREIGN KEY ("rds_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_tenants_roles_order_idx" ON "users_tenants_roles" USING btree ("order");
  CREATE INDEX "users_tenants_roles_parent_idx" ON "users_tenants_roles" USING btree ("parent_id");
  CREATE INDEX "users_tenants_order_idx" ON "users_tenants" USING btree ("_order");
  CREATE INDEX "users_tenants_parent_id_idx" ON "users_tenants" USING btree ("_parent_id");
  CREATE INDEX "users_tenants_tenant_idx" ON "users_tenants" USING btree ("tenant_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "tenants_trusted_domains_order_idx" ON "tenants_trusted_domains" USING btree ("_order");
  CREATE INDEX "tenants_trusted_domains_parent_id_idx" ON "tenants_trusted_domains" USING btree ("_parent_id");
  CREATE INDEX "tenants_enabled_locales_order_idx" ON "tenants_enabled_locales" USING btree ("order");
  CREATE INDEX "tenants_enabled_locales_parent_idx" ON "tenants_enabled_locales" USING btree ("parent_id");
  CREATE UNIQUE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");
  CREATE INDEX "tenants_updated_at_idx" ON "tenants" USING btree ("updated_at");
  CREATE INDEX "tenants_created_at_idx" ON "tenants" USING btree ("created_at");
  CREATE INDEX "tenant_media_tenant_idx" ON "tenant_media" USING btree ("tenant_id");
  CREATE INDEX "tenant_media_updated_at_idx" ON "tenant_media" USING btree ("updated_at");
  CREATE INDEX "tenant_media_created_at_idx" ON "tenant_media" USING btree ("created_at");
  CREATE INDEX "tenant_media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "tenant_media" USING btree ("sizes_thumbnail_filename");
  CREATE UNIQUE INDEX "tenant_media_tenant_filename_idx" ON "tenant_media" USING btree ("tenant_id","filename");
  CREATE INDEX "rds_common_alert_order_idx" ON "rds_common_alert" USING btree ("_order");
  CREATE INDEX "rds_common_alert_parent_id_idx" ON "rds_common_alert" USING btree ("_parent_id");
  CREATE INDEX "rds_common_alert_locale_idx" ON "rds_common_alert" USING btree ("_locale");
  CREATE INDEX "rds_common_data_providers_order_idx" ON "rds_common_data_providers" USING btree ("_order");
  CREATE INDEX "rds_common_data_providers_parent_id_idx" ON "rds_common_data_providers" USING btree ("_parent_id");
  CREATE INDEX "rds_common_data_providers_locale_idx" ON "rds_common_data_providers" USING btree ("_locale");
  CREATE INDEX "rds_common_data_providers_logo_idx" ON "rds_common_data_providers" USING btree ("logo_id");
  CREATE INDEX "rds_header_custom_menu_order_idx" ON "rds_header_custom_menu" USING btree ("_order");
  CREATE INDEX "rds_header_custom_menu_parent_id_idx" ON "rds_header_custom_menu" USING btree ("_parent_id");
  CREATE INDEX "rds_header_custom_menu_locale_idx" ON "rds_header_custom_menu" USING btree ("_locale");
  CREATE INDEX "rds_footer_custom_menu_order_idx" ON "rds_footer_custom_menu" USING btree ("_order");
  CREATE INDEX "rds_footer_custom_menu_parent_id_idx" ON "rds_footer_custom_menu" USING btree ("_parent_id");
  CREATE INDEX "rds_footer_custom_menu_locale_idx" ON "rds_footer_custom_menu" USING btree ("_locale");
  CREATE INDEX "rds_suggestions_order_idx" ON "rds_suggestions" USING btree ("_order");
  CREATE INDEX "rds_suggestions_parent_id_idx" ON "rds_suggestions" USING btree ("_parent_id");
  CREATE INDEX "rds_suggestions_locale_idx" ON "rds_suggestions" USING btree ("_locale");
  CREATE INDEX "rds_topics_list_subtopics_order_idx" ON "rds_topics_list_subtopics" USING btree ("_order");
  CREATE INDEX "rds_topics_list_subtopics_parent_id_idx" ON "rds_topics_list_subtopics" USING btree ("_parent_id");
  CREATE INDEX "rds_topics_list_subtopics_locale_idx" ON "rds_topics_list_subtopics" USING btree ("_locale");
  CREATE INDEX "rds_topics_list_order_idx" ON "rds_topics_list" USING btree ("_order");
  CREATE INDEX "rds_topics_list_parent_id_idx" ON "rds_topics_list" USING btree ("_parent_id");
  CREATE INDEX "rds_topics_list_locale_idx" ON "rds_topics_list" USING btree ("_locale");
  CREATE INDEX "rds_topics_list_image_idx" ON "rds_topics_list" USING btree ("image_id");
  CREATE INDEX "rds_search_search_settings_radius_select_values_order_idx" ON "rds_search_search_settings_radius_select_values" USING btree ("_order");
  CREATE INDEX "rds_search_search_settings_radius_select_values_parent_id_idx" ON "rds_search_search_settings_radius_select_values" USING btree ("_parent_id");
  CREATE INDEX "rds_new_layout_callouts_options_order_idx" ON "rds_new_layout_callouts_options" USING btree ("_order");
  CREATE INDEX "rds_new_layout_callouts_options_parent_id_idx" ON "rds_new_layout_callouts_options" USING btree ("_parent_id");
  CREATE INDEX "rds_new_layout_callouts_options_locale_idx" ON "rds_new_layout_callouts_options" USING btree ("_locale");
  CREATE INDEX "rds_new_layout_callouts_options_custom_img_idx" ON "rds_new_layout_callouts_options" USING btree ("custom_img_id");
  CREATE UNIQUE INDEX "rds_tenant_idx" ON "rds" USING btree ("tenant_id");
  CREATE INDEX "rds_brand_brand_logo_idx" ON "rds" USING btree ("brand_logo_id");
  CREATE INDEX "rds_brand_brand_favicon_idx" ON "rds" USING btree ("brand_favicon_id");
  CREATE INDEX "rds_brand_brand_hero_idx" ON "rds" USING btree ("brand_hero_id");
  CREATE INDEX "rds_brand_brand_open_graph_idx" ON "rds" USING btree ("brand_open_graph_id");
  CREATE INDEX "rds_new_layout_new_layout_hero_idx" ON "rds" USING btree ("new_layout_hero_id");
  CREATE INDEX "rds_new_layout_new_layout_logo_idx" ON "rds" USING btree ("new_layout_logo_id");
  CREATE INDEX "rds_updated_at_idx" ON "rds" USING btree ("updated_at");
  CREATE INDEX "rds_created_at_idx" ON "rds" USING btree ("created_at");
  CREATE UNIQUE INDEX "rds_locales_locale_parent_id_unique" ON "rds_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_common_alert_order_idx" ON "_rds_v_version_common_alert" USING btree ("_order");
  CREATE INDEX "_rds_v_version_common_alert_parent_id_idx" ON "_rds_v_version_common_alert" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_common_alert_locale_idx" ON "_rds_v_version_common_alert" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_common_data_providers_order_idx" ON "_rds_v_version_common_data_providers" USING btree ("_order");
  CREATE INDEX "_rds_v_version_common_data_providers_parent_id_idx" ON "_rds_v_version_common_data_providers" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_common_data_providers_locale_idx" ON "_rds_v_version_common_data_providers" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_common_data_providers_logo_idx" ON "_rds_v_version_common_data_providers" USING btree ("logo_id");
  CREATE INDEX "_rds_v_version_header_custom_menu_order_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_order");
  CREATE INDEX "_rds_v_version_header_custom_menu_parent_id_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_header_custom_menu_locale_idx" ON "_rds_v_version_header_custom_menu" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_footer_custom_menu_order_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_order");
  CREATE INDEX "_rds_v_version_footer_custom_menu_parent_id_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_footer_custom_menu_locale_idx" ON "_rds_v_version_footer_custom_menu" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_suggestions_order_idx" ON "_rds_v_version_suggestions" USING btree ("_order");
  CREATE INDEX "_rds_v_version_suggestions_parent_id_idx" ON "_rds_v_version_suggestions" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_suggestions_locale_idx" ON "_rds_v_version_suggestions" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_topics_list_subtopics_order_idx" ON "_rds_v_version_topics_list_subtopics" USING btree ("_order");
  CREATE INDEX "_rds_v_version_topics_list_subtopics_parent_id_idx" ON "_rds_v_version_topics_list_subtopics" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_topics_list_subtopics_locale_idx" ON "_rds_v_version_topics_list_subtopics" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_topics_list_order_idx" ON "_rds_v_version_topics_list" USING btree ("_order");
  CREATE INDEX "_rds_v_version_topics_list_parent_id_idx" ON "_rds_v_version_topics_list" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_topics_list_locale_idx" ON "_rds_v_version_topics_list" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_topics_list_image_idx" ON "_rds_v_version_topics_list" USING btree ("image_id");
  CREATE INDEX "_rds_v_version_search_search_settings_radius_select_values_order_idx" ON "_rds_v_version_search_search_settings_radius_select_values" USING btree ("_order");
  CREATE INDEX "_rds_v_version_search_search_settings_radius_select_values_parent_id_idx" ON "_rds_v_version_search_search_settings_radius_select_values" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_order_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("_order");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_parent_id_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_locale_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("_locale");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_custom_img_idx" ON "_rds_v_version_new_layout_callouts_options" USING btree ("custom_img_id");
  CREATE INDEX "_rds_v_parent_idx" ON "_rds_v" USING btree ("parent_id");
  CREATE INDEX "_rds_v_version_version_tenant_idx" ON "_rds_v" USING btree ("version_tenant_id");
  CREATE INDEX "_rds_v_version_brand_version_brand_logo_idx" ON "_rds_v" USING btree ("version_brand_logo_id");
  CREATE INDEX "_rds_v_version_brand_version_brand_favicon_idx" ON "_rds_v" USING btree ("version_brand_favicon_id");
  CREATE INDEX "_rds_v_version_brand_version_brand_hero_idx" ON "_rds_v" USING btree ("version_brand_hero_id");
  CREATE INDEX "_rds_v_version_brand_version_brand_open_graph_idx" ON "_rds_v" USING btree ("version_brand_open_graph_id");
  CREATE INDEX "_rds_v_version_new_layout_version_new_layout_hero_idx" ON "_rds_v" USING btree ("version_new_layout_hero_id");
  CREATE INDEX "_rds_v_version_new_layout_version_new_layout_logo_idx" ON "_rds_v" USING btree ("version_new_layout_logo_id");
  CREATE INDEX "_rds_v_version_version_updated_at_idx" ON "_rds_v" USING btree ("version_updated_at");
  CREATE INDEX "_rds_v_version_version_created_at_idx" ON "_rds_v" USING btree ("version_created_at");
  CREATE INDEX "_rds_v_created_at_idx" ON "_rds_v" USING btree ("created_at");
  CREATE INDEX "_rds_v_updated_at_idx" ON "_rds_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "_rds_v_locales_locale_parent_id_unique" ON "_rds_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_tenants_id_idx" ON "payload_locked_documents_rels" USING btree ("tenants_id");
  CREATE INDEX "payload_locked_documents_rels_tenant_media_id_idx" ON "payload_locked_documents_rels" USING btree ("tenant_media_id");
  CREATE INDEX "payload_locked_documents_rels_rds_id_idx" ON "payload_locked_documents_rels" USING btree ("rds_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_tenants_roles" CASCADE;
  DROP TABLE "users_tenants" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "tenants_trusted_domains" CASCADE;
  DROP TABLE "tenants_enabled_locales" CASCADE;
  DROP TABLE "tenants" CASCADE;
  DROP TABLE "tenant_media" CASCADE;
  DROP TABLE "rds_common_alert" CASCADE;
  DROP TABLE "rds_common_data_providers" CASCADE;
  DROP TABLE "rds_header_custom_menu" CASCADE;
  DROP TABLE "rds_footer_custom_menu" CASCADE;
  DROP TABLE "rds_suggestions" CASCADE;
  DROP TABLE "rds_topics_list_subtopics" CASCADE;
  DROP TABLE "rds_topics_list" CASCADE;
  DROP TABLE "rds_search_search_settings_radius_select_values" CASCADE;
  DROP TABLE "rds_new_layout_callouts_options" CASCADE;
  DROP TABLE "rds" CASCADE;
  DROP TABLE "rds_locales" CASCADE;
  DROP TABLE "_rds_v_version_common_alert" CASCADE;
  DROP TABLE "_rds_v_version_common_data_providers" CASCADE;
  DROP TABLE "_rds_v_version_header_custom_menu" CASCADE;
  DROP TABLE "_rds_v_version_footer_custom_menu" CASCADE;
  DROP TABLE "_rds_v_version_suggestions" CASCADE;
  DROP TABLE "_rds_v_version_topics_list_subtopics" CASCADE;
  DROP TABLE "_rds_v_version_topics_list" CASCADE;
  DROP TABLE "_rds_v_version_search_search_settings_radius_select_values" CASCADE;
  DROP TABLE "_rds_v_version_new_layout_callouts_options" CASCADE;
  DROP TABLE "_rds_v" CASCADE;
  DROP TABLE "_rds_v_locales" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_tenants_roles";
  DROP TYPE "public"."enum_tenants_enabled_locales";
  DROP TYPE "public"."enum_tenants_default_locale";
  DROP TYPE "public"."enum_rds_common_alert_variant";
  DROP TYPE "public"."enum_rds_header_custom_menu_target";
  DROP TYPE "public"."enum_rds_footer_custom_menu_target";
  DROP TYPE "public"."enum_rds_topics_list_subtopics_query_type";
  DROP TYPE "public"."enum_rds_topics_list_subtopics_target";
  DROP TYPE "public"."enum_rds_topics_list_target";
  DROP TYPE "public"."enum_rds_new_layout_callouts_options_type";
  DROP TYPE "public"."enum_rds_new_layout_callouts_options_url_target";
  DROP TYPE "public"."enum_rds_common_sms_provider";
  DROP TYPE "public"."enum_rds_topics_icon_size";
  DROP TYPE "public"."enum__rds_v_version_common_alert_variant";
  DROP TYPE "public"."enum__rds_v_version_header_custom_menu_target";
  DROP TYPE "public"."enum__rds_v_version_footer_custom_menu_target";
  DROP TYPE "public"."enum__rds_v_version_topics_list_subtopics_query_type";
  DROP TYPE "public"."enum__rds_v_version_topics_list_subtopics_target";
  DROP TYPE "public"."enum__rds_v_version_topics_list_target";
  DROP TYPE "public"."enum__rds_v_version_new_layout_callouts_options_type";
  DROP TYPE "public"."enum__rds_v_version_new_layout_callouts_options_url_target";
  DROP TYPE "public"."enum__rds_v_version_common_sms_provider";
  DROP TYPE "public"."enum__rds_v_version_topics_icon_size";`)
}
