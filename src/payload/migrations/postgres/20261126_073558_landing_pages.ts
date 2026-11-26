import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_lp_topics_search_query_type" AS ENUM('taxonomy', 'text');

    CREATE TYPE "public"."enum_lp_topics_source_kind" AS ENUM('subtopic', 'suggestion', 'custom');

    CREATE TYPE "public"."enum__lp_topics_v_version_search_query_type" AS ENUM('taxonomy', 'text');

    CREATE TYPE "public"."enum__lp_topics_v_version_source_kind" AS ENUM('subtopic', 'suggestion', 'custom');

    CREATE TYPE "public"."enum_lp_pages_status" AS ENUM('live', 'off', 'retired');

    CREATE TYPE "public"."enum_lp_pages_region_type" AS ENUM('state', 'county', 'place');

    CREATE TYPE "public"."enum__lp_pages_v_version_status" AS ENUM('live', 'off', 'retired');

    CREATE TYPE "public"."enum__lp_pages_v_version_region_type" AS ENUM('state', 'county', 'place');

    ALTER TYPE "public"."enum_payload_jobs_log_task_slug"
    ADD VALUE 'generateLandingPages';

    ALTER TYPE "public"."enum_payload_jobs_log_task_slug"
    ADD VALUE 'warmLandingPages';

    ALTER TYPE "public"."enum_payload_jobs_log_task_slug"
    ADD VALUE 'translateLandingTopic';

    ALTER TYPE "public"."enum_payload_jobs_task_slug"
    ADD VALUE 'generateLandingPages';

    ALTER TYPE "public"."enum_payload_jobs_task_slug"
    ADD VALUE 'warmLandingPages';

    ALTER TYPE "public"."enum_payload_jobs_task_slug"
    ADD VALUE 'translateLandingTopic';

    CREATE TABLE "lp_topics" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" varchar,
      "search_query_type" "enum_lp_topics_search_query_type" DEFAULT 'taxonomy' NOT NULL,
      "search_query" varchar NOT NULL,
      "source_kind" "enum_lp_topics_source_kind" DEFAULT 'custom' NOT NULL,
      "source_ref" varchar,
      "source_label" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "deleted_at" timestamp(3) with time zone
    );

    CREATE TABLE "lp_topics_locales" (
      "name" varchar NOT NULL,
      "slug" varchar,
      "copy_title" varchar,
      "copy_description" varchar,
      "copy_h1" varchar,
      "copy_intro" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "_lp_topics_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_tenant_id" varchar,
      "version_search_query_type" "enum__lp_topics_v_version_search_query_type" DEFAULT 'taxonomy' NOT NULL,
      "version_search_query" varchar NOT NULL,
      "version_source_kind" "enum__lp_topics_v_version_source_kind" DEFAULT 'custom' NOT NULL,
      "version_source_ref" varchar,
      "version_source_label" varchar,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version_deleted_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "_lp_topics_v_locales" (
      "version_name" varchar NOT NULL,
      "version_slug" varchar,
      "version_copy_title" varchar,
      "version_copy_description" varchar,
      "version_copy_h1" varchar,
      "version_copy_intro" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    CREATE TABLE "lp_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" varchar,
      "label" varchar,
      "topic_id" integer NOT NULL,
      "status" "enum_lp_pages_status" DEFAULT 'live' NOT NULL,
      "region_id" varchar NOT NULL,
      "region_type" "enum_lp_pages_region_type" NOT NULL,
      "region_name" varchar NOT NULL,
      "region_state" varchar NOT NULL,
      "county_id" varchar,
      "place_slug" varchar NOT NULL,
      "redirect_page_id" integer,
      "redirect_path" varchar,
      "result_count" numeric,
      "counted_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "_lp_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_tenant_id" varchar,
      "version_label" varchar,
      "version_topic_id" integer NOT NULL,
      "version_status" "enum__lp_pages_v_version_status" DEFAULT 'live' NOT NULL,
      "version_region_id" varchar NOT NULL,
      "version_region_type" "enum__lp_pages_v_version_region_type" NOT NULL,
      "version_region_name" varchar NOT NULL,
      "version_region_state" varchar NOT NULL,
      "version_county_id" varchar,
      "version_place_slug" varchar NOT NULL,
      "version_redirect_page_id" integer,
      "version_redirect_path" varchar,
      "version_result_count" numeric,
      "version_counted_at" timestamp(3) with time zone,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "lp_slugs" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" varchar,
      "locale" varchar NOT NULL,
      "path" varchar NOT NULL,
      "current" boolean DEFAULT TRUE,
      "page_id" integer NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_enable_landing_pages" boolean DEFAULT FALSE;

    ALTER TABLE "rds"
    ADD COLUMN "landing_pages_regions" jsonb;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_title" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_description" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_h1" varchar;

    ALTER TABLE "rds_locales"
    ADD COLUMN "landing_pages_templates_intro" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_enable_landing_pages" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_landing_pages_regions" jsonb;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_title" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_description" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_h1" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_landing_pages_templates_intro" varchar;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "lp_topics_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "lp_pages_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "lp_slugs_id" integer;

    ALTER TABLE "lp_topics"
    ADD CONSTRAINT "lp_topics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "lp_topics_locales"
    ADD CONSTRAINT "lp_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lp_topics" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_lp_topics_v"
    ADD CONSTRAINT "_lp_topics_v_parent_id_lp_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lp_topics" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_topics_v"
    ADD CONSTRAINT "_lp_topics_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_topics_v_locales"
    ADD CONSTRAINT "_lp_topics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lp_topics_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "lp_pages"
    ADD CONSTRAINT "lp_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "lp_pages"
    ADD CONSTRAINT "lp_pages_topic_id_lp_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."lp_topics" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "lp_pages"
    ADD CONSTRAINT "lp_pages_redirect_page_id_lp_pages_id_fk" FOREIGN KEY ("redirect_page_id") REFERENCES "public"."lp_pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_pages_v"
    ADD CONSTRAINT "_lp_pages_v_parent_id_lp_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lp_pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_pages_v"
    ADD CONSTRAINT "_lp_pages_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_pages_v"
    ADD CONSTRAINT "_lp_pages_v_version_topic_id_lp_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."lp_topics" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_lp_pages_v"
    ADD CONSTRAINT "_lp_pages_v_version_redirect_page_id_lp_pages_id_fk" FOREIGN KEY ("version_redirect_page_id") REFERENCES "public"."lp_pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "lp_slugs"
    ADD CONSTRAINT "lp_slugs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "lp_slugs"
    ADD CONSTRAINT "lp_slugs_page_id_lp_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."lp_pages" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    CREATE INDEX "lp_topics_tenant_idx" ON "lp_topics" USING btree ("tenant_id");

    CREATE INDEX "lp_topics_updated_at_idx" ON "lp_topics" USING btree ("updated_at");

    CREATE INDEX "lp_topics_created_at_idx" ON "lp_topics" USING btree ("created_at");

    CREATE INDEX "lp_topics_deleted_at_idx" ON "lp_topics" USING btree ("deleted_at");

    CREATE INDEX "lp_topics_slug_idx" ON "lp_topics_locales" USING btree ("slug", "_locale");

    CREATE UNIQUE INDEX "lp_topics_locales_locale_parent_id_unique" ON "lp_topics_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "lp_topics_locales_parent_id_idx" ON "lp_topics_locales" USING btree ("_parent_id");

    CREATE INDEX "_lp_topics_v_parent_idx" ON "_lp_topics_v" USING btree ("parent_id");

    CREATE INDEX "_lp_topics_v_version_version_tenant_idx" ON "_lp_topics_v" USING btree ("version_tenant_id");

    CREATE INDEX "_lp_topics_v_version_version_updated_at_idx" ON "_lp_topics_v" USING btree ("version_updated_at");

    CREATE INDEX "_lp_topics_v_version_version_created_at_idx" ON "_lp_topics_v" USING btree ("version_created_at");

    CREATE INDEX "_lp_topics_v_version_version_deleted_at_idx" ON "_lp_topics_v" USING btree ("version_deleted_at");

    CREATE INDEX "_lp_topics_v_created_at_idx" ON "_lp_topics_v" USING btree ("created_at");

    CREATE INDEX "_lp_topics_v_updated_at_idx" ON "_lp_topics_v" USING btree ("updated_at");

    CREATE INDEX "_lp_topics_v_version_version_slug_idx" ON "_lp_topics_v_locales" USING btree ("version_slug", "_locale");

    CREATE UNIQUE INDEX "_lp_topics_v_locales_locale_parent_id_unique" ON "_lp_topics_v_locales" USING btree ("_locale", "_parent_id");

    CREATE INDEX "_lp_topics_v_locales_parent_id_idx" ON "_lp_topics_v_locales" USING btree ("_parent_id");

    CREATE INDEX "lp_pages_tenant_idx" ON "lp_pages" USING btree ("tenant_id");

    CREATE INDEX "lp_pages_topic_idx" ON "lp_pages" USING btree ("topic_id");

    CREATE INDEX "lp_pages_status_idx" ON "lp_pages" USING btree ("status");

    CREATE INDEX "lp_pages_region_id_idx" ON "lp_pages" USING btree ("region_id");

    CREATE INDEX "lp_pages_region_type_idx" ON "lp_pages" USING btree ("region_type");

    CREATE INDEX "lp_pages_region_state_idx" ON "lp_pages" USING btree ("region_state");

    CREATE INDEX "lp_pages_county_id_idx" ON "lp_pages" USING btree ("county_id");

    CREATE INDEX "lp_pages_redirect_redirect_page_idx" ON "lp_pages" USING btree ("redirect_page_id");

    CREATE INDEX "lp_pages_updated_at_idx" ON "lp_pages" USING btree ("updated_at");

    CREATE INDEX "lp_pages_created_at_idx" ON "lp_pages" USING btree ("created_at");

    CREATE UNIQUE INDEX "tenant_topic_regionId_idx" ON "lp_pages" USING btree ("tenant_id", "topic_id", "region_id");

    CREATE INDEX "_lp_pages_v_parent_idx" ON "_lp_pages_v" USING btree ("parent_id");

    CREATE INDEX "_lp_pages_v_version_version_tenant_idx" ON "_lp_pages_v" USING btree ("version_tenant_id");

    CREATE INDEX "_lp_pages_v_version_version_topic_idx" ON "_lp_pages_v" USING btree ("version_topic_id");

    CREATE INDEX "_lp_pages_v_version_version_status_idx" ON "_lp_pages_v" USING btree ("version_status");

    CREATE INDEX "_lp_pages_v_version_version_region_id_idx" ON "_lp_pages_v" USING btree ("version_region_id");

    CREATE INDEX "_lp_pages_v_version_version_region_type_idx" ON "_lp_pages_v" USING btree ("version_region_type");

    CREATE INDEX "_lp_pages_v_version_version_region_state_idx" ON "_lp_pages_v" USING btree ("version_region_state");

    CREATE INDEX "_lp_pages_v_version_version_county_id_idx" ON "_lp_pages_v" USING btree ("version_county_id");

    CREATE INDEX "_lp_pages_v_version_redirect_version_redirect_page_idx" ON "_lp_pages_v" USING btree ("version_redirect_page_id");

    CREATE INDEX "_lp_pages_v_version_version_updated_at_idx" ON "_lp_pages_v" USING btree ("version_updated_at");

    CREATE INDEX "_lp_pages_v_version_version_created_at_idx" ON "_lp_pages_v" USING btree ("version_created_at");

    CREATE INDEX "_lp_pages_v_created_at_idx" ON "_lp_pages_v" USING btree ("created_at");

    CREATE INDEX "_lp_pages_v_updated_at_idx" ON "_lp_pages_v" USING btree ("updated_at");

    CREATE INDEX "version_tenant_version_topic_version_regionId_idx" ON "_lp_pages_v" USING btree (
      "version_tenant_id",
      "version_topic_id",
      "version_region_id"
    );

    CREATE INDEX "lp_slugs_tenant_idx" ON "lp_slugs" USING btree ("tenant_id");

    CREATE INDEX "lp_slugs_locale_idx" ON "lp_slugs" USING btree ("locale");

    CREATE INDEX "lp_slugs_path_idx" ON "lp_slugs" USING btree ("path");

    CREATE INDEX "lp_slugs_current_idx" ON "lp_slugs" USING btree ("current");

    CREATE INDEX "lp_slugs_page_idx" ON "lp_slugs" USING btree ("page_id");

    CREATE INDEX "lp_slugs_updated_at_idx" ON "lp_slugs" USING btree ("updated_at");

    CREATE INDEX "lp_slugs_created_at_idx" ON "lp_slugs" USING btree ("created_at");

    CREATE UNIQUE INDEX "tenant_locale_path_idx" ON "lp_slugs" USING btree ("tenant_id", "locale", "path");

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_landing_page_topics_fk" FOREIGN KEY ("lp_topics_id") REFERENCES "public"."lp_topics" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("lp_pages_id") REFERENCES "public"."lp_pages" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_landing_page_slugs_fk" FOREIGN KEY ("lp_slugs_id") REFERENCES "public"."lp_slugs" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "payload_locked_documents_rels_lp_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("lp_topics_id");

    CREATE INDEX "payload_locked_documents_rels_lp_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("lp_pages_id");

    CREATE INDEX "payload_locked_documents_rels_lp_slugs_id_idx" ON "payload_locked_documents_rels" USING btree ("lp_slugs_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lp_topics" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "lp_topics_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_lp_topics_v" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_lp_topics_v_locales" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "lp_pages" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_lp_pages_v" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "lp_slugs" DISABLE ROW LEVEL SECURITY;

    DROP TABLE "lp_topics" CASCADE;

    DROP TABLE "lp_topics_locales" CASCADE;

    DROP TABLE "_lp_topics_v" CASCADE;

    DROP TABLE "_lp_topics_v_locales" CASCADE;

    DROP TABLE "lp_pages" CASCADE;

    DROP TABLE "_lp_pages_v" CASCADE;

    DROP TABLE "lp_slugs" CASCADE;

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_landing_page_topics_fk";

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_landing_pages_fk";

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_landing_page_slugs_fk";

    ALTER TABLE "payload_jobs_log"
    ALTER COLUMN "task_slug"
    SET DATA TYPE text;

    DROP TYPE "public"."enum_payload_jobs_log_task_slug";

    CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM(
      'inline',
      'translateTopics',
      'translate',
      'warmCache',
      'deliverScheduledPdfs'
    );

    ALTER TABLE "payload_jobs_log"
    ALTER COLUMN "task_slug"
    SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";

    ALTER TABLE "payload_jobs"
    ALTER COLUMN "task_slug"
    SET DATA TYPE text;

    DROP TYPE "public"."enum_payload_jobs_task_slug";

    CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM(
      'inline',
      'translateTopics',
      'translate',
      'warmCache',
      'deliverScheduledPdfs'
    );

    ALTER TABLE "payload_jobs"
    ALTER COLUMN "task_slug"
    SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";

    DROP INDEX "payload_locked_documents_rels_lp_topics_id_idx";

    DROP INDEX "payload_locked_documents_rels_lp_pages_id_idx";

    DROP INDEX "payload_locked_documents_rels_lp_slugs_id_idx";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_enable_landing_pages";

    ALTER TABLE "rds"
    DROP COLUMN "landing_pages_regions";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_title";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_description";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_h1";

    ALTER TABLE "rds_locales"
    DROP COLUMN "landing_pages_templates_intro";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_enable_landing_pages";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_landing_pages_regions";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_title";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_description";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_h1";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_landing_pages_templates_intro";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "lp_topics_id";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "lp_pages_id";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "lp_slugs_id";

    DROP TYPE "public"."enum_lp_topics_search_query_type";

    DROP TYPE "public"."enum_lp_topics_source_kind";

    DROP TYPE "public"."enum__lp_topics_v_version_search_query_type";

    DROP TYPE "public"."enum__lp_topics_v_version_source_kind";

    DROP TYPE "public"."enum_lp_pages_status";

    DROP TYPE "public"."enum_lp_pages_region_type";

    DROP TYPE "public"."enum__lp_pages_v_version_status";

    DROP TYPE "public"."enum__lp_pages_v_version_region_type";
  `);
}
