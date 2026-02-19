import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_oc_schemas_custom_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TYPE "public"."enum__oc_v_version_schemas_custom_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TABLE "oc_schemas_custom_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum_oc_schemas_custom_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true
  );
  
  CREATE TABLE "oc_schemas_custom_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "oc_schemas" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"schema_name" varchar NOT NULL
  );
  
  CREATE TABLE "oc" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tenant_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_oc_v_version_schemas_custom_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum__oc_v_version_schemas_custom_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_oc_v_version_schemas_custom_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_oc_v_version_schemas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"schema_name" varchar NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_oc_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_tenant_id" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "rds_custom_attributes_attributes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rds_custom_attributes_attributes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "rds_custom_attributes_attributes" CASCADE;
  DROP TABLE "rds_custom_attributes_attributes_locales" CASCADE;
  DROP TABLE "_rds_v_version_custom_attributes_attributes" CASCADE;
  DROP TABLE "_rds_v_version_custom_attributes_attributes_locales" CASCADE;
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'syncOrchestrationConfig');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'syncOrchestrationConfig');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "oc_id" varchar;
  ALTER TABLE "oc_schemas_custom_attributes" ADD CONSTRAINT "oc_schemas_custom_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."oc_schemas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "oc_schemas_custom_attributes_locales" ADD CONSTRAINT "oc_schemas_custom_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."oc_schemas_custom_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "oc_schemas" ADD CONSTRAINT "oc_schemas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."oc"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "oc" ADD CONSTRAINT "oc_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" ADD CONSTRAINT "_oc_v_version_schemas_custom_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_oc_v_version_schemas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes_locales" ADD CONSTRAINT "_oc_v_version_schemas_custom_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_oc_v_version_schemas_custom_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_oc_v_version_schemas" ADD CONSTRAINT "_oc_v_version_schemas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_oc_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_oc_v" ADD CONSTRAINT "_oc_v_parent_id_oc_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."oc"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_oc_v" ADD CONSTRAINT "_oc_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "oc_schemas_custom_attributes_order_idx" ON "oc_schemas_custom_attributes" USING btree ("_order");
  CREATE INDEX "oc_schemas_custom_attributes_parent_id_idx" ON "oc_schemas_custom_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "oc_schemas_custom_attributes_locales_locale_parent_id_unique" ON "oc_schemas_custom_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "oc_schemas_order_idx" ON "oc_schemas" USING btree ("_order");
  CREATE INDEX "oc_schemas_parent_id_idx" ON "oc_schemas" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "oc_tenant_idx" ON "oc" USING btree ("tenant_id");
  CREATE INDEX "oc_updated_at_idx" ON "oc" USING btree ("updated_at");
  CREATE INDEX "oc_created_at_idx" ON "oc" USING btree ("created_at");
  CREATE INDEX "_oc_v_version_schemas_custom_attributes_order_idx" ON "_oc_v_version_schemas_custom_attributes" USING btree ("_order");
  CREATE INDEX "_oc_v_version_schemas_custom_attributes_parent_id_idx" ON "_oc_v_version_schemas_custom_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_oc_v_version_schemas_custom_attributes_locales_locale_paren" ON "_oc_v_version_schemas_custom_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_oc_v_version_schemas_order_idx" ON "_oc_v_version_schemas" USING btree ("_order");
  CREATE INDEX "_oc_v_version_schemas_parent_id_idx" ON "_oc_v_version_schemas" USING btree ("_parent_id");
  CREATE INDEX "_oc_v_parent_idx" ON "_oc_v" USING btree ("parent_id");
  CREATE INDEX "_oc_v_version_version_tenant_idx" ON "_oc_v" USING btree ("version_tenant_id");
  CREATE INDEX "_oc_v_version_version_updated_at_idx" ON "_oc_v" USING btree ("version_updated_at");
  CREATE INDEX "_oc_v_version_version_created_at_idx" ON "_oc_v" USING btree ("version_created_at");
  CREATE INDEX "_oc_v_created_at_idx" ON "_oc_v" USING btree ("created_at");
  CREATE INDEX "_oc_v_updated_at_idx" ON "_oc_v" USING btree ("updated_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orchestration_config_fk" FOREIGN KEY ("oc_id") REFERENCES "public"."oc"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_oc_id_idx" ON "payload_locked_documents_rels" USING btree ("oc_id");
  DROP TYPE "public"."enum_rds_custom_attributes_attributes_link_entity";
  DROP TYPE "public"."enum__rds_v_version_custom_attributes_attributes_link_entity";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds_custom_attributes_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TYPE "public"."enum__rds_v_version_custom_attributes_attributes_link_entity" AS ENUM('organization', 'service', 'location');
  CREATE TABLE "rds_custom_attributes_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum_rds_custom_attributes_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true
  );
  
  CREATE TABLE "rds_custom_attributes_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "_rds_v_version_custom_attributes_attributes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_column" varchar NOT NULL,
  	"link_entity" "enum__rds_v_version_custom_attributes_attributes_link_entity" NOT NULL,
  	"provenance" varchar,
  	"searchable" boolean DEFAULT true,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_rds_v_version_custom_attributes_attributes_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "oc_schemas_custom_attributes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "oc_schemas_custom_attributes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "oc_schemas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "oc" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oc_v_version_schemas" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_oc_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "oc_schemas_custom_attributes" CASCADE;
  DROP TABLE "oc_schemas_custom_attributes_locales" CASCADE;
  DROP TABLE "oc_schemas" CASCADE;
  DROP TABLE "oc" CASCADE;
  DROP TABLE "_oc_v_version_schemas_custom_attributes" CASCADE;
  DROP TABLE "_oc_v_version_schemas_custom_attributes_locales" CASCADE;
  DROP TABLE "_oc_v_version_schemas" CASCADE;
  DROP TABLE "_oc_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orchestration_config_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'syncCustomAttributes');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'translateTopics', 'translate', 'warmCache', 'syncCustomAttributes');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_oc_id_idx";
  ALTER TABLE "rds_custom_attributes_attributes" ADD CONSTRAINT "rds_custom_attributes_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "rds_custom_attributes_attributes_locales" ADD CONSTRAINT "rds_custom_attributes_attributes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds_custom_attributes_attributes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes" ADD CONSTRAINT "_rds_v_version_custom_attributes_attributes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_rds_v_version_custom_attributes_attributes_locales" ADD CONSTRAINT "_rds_v_version_custom_attributes_attributes_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v_version_custom_attributes_attributes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "rds_custom_attributes_attributes_order_idx" ON "rds_custom_attributes_attributes" USING btree ("_order");
  CREATE INDEX "rds_custom_attributes_attributes_parent_id_idx" ON "rds_custom_attributes_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "rds_custom_attributes_attributes_locales_locale_parent_id_un" ON "rds_custom_attributes_attributes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_rds_v_version_custom_attributes_attributes_order_idx" ON "_rds_v_version_custom_attributes_attributes" USING btree ("_order");
  CREATE INDEX "_rds_v_version_custom_attributes_attributes_parent_id_idx" ON "_rds_v_version_custom_attributes_attributes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_rds_v_version_custom_attributes_attributes_locales_locale_p" ON "_rds_v_version_custom_attributes_attributes_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "oc_id";
  DROP TYPE "public"."enum_oc_schemas_custom_attributes_link_entity";
  DROP TYPE "public"."enum__oc_v_version_schemas_custom_attributes_link_entity";`)
}
