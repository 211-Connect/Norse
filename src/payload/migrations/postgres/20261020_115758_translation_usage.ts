import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "translation_usage" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" varchar NOT NULL,
      "month" varchar NOT NULL,
      "user_email" varchar NOT NULL,
      "billed_characters" numeric DEFAULT 0 NOT NULL,
      "requested_characters" numeric DEFAULT 0 NOT NULL,
      "translation_runs" numeric DEFAULT 0 NOT NULL,
      "largest_field_characters" numeric DEFAULT 0 NOT NULL,
      "locales" jsonb,
      "last_used_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "translation_usage_alerts" (
      "id" serial PRIMARY KEY NOT NULL,
      "tenant_id" varchar NOT NULL,
      "month" varchar NOT NULL,
      "billed_characters" numeric NOT NULL,
      "threshold_usd" numeric NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "rds"
    ADD COLUMN "printable_directories_translation_alert_threshold_usd" numeric;

    ALTER TABLE "rds"
    ADD COLUMN "printable_directories_translation_user_quota_usd" numeric;

    ALTER TABLE "rds"
    ADD COLUMN "printable_directories_translation_tenant_cap_usd" numeric;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_printable_directories_translation_alert_threshold_usd" numeric;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_printable_directories_translation_user_quota_usd" numeric;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_printable_directories_translation_tenant_cap_usd" numeric;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "translation_usage_id" integer;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "translation_usage_alerts_id" integer;

    CREATE INDEX "translation_usage_tenant_id_idx" ON "translation_usage" USING btree ("tenant_id");

    CREATE INDEX "translation_usage_month_idx" ON "translation_usage" USING btree ("month");

    CREATE INDEX "translation_usage_updated_at_idx" ON "translation_usage" USING btree ("updated_at");

    CREATE INDEX "translation_usage_created_at_idx" ON "translation_usage" USING btree ("created_at");

    CREATE UNIQUE INDEX "tenantId_month_userEmail_idx" ON "translation_usage" USING btree ("tenant_id", "month", "user_email");

    CREATE INDEX "translation_usage_alerts_updated_at_idx" ON "translation_usage_alerts" USING btree ("updated_at");

    CREATE INDEX "translation_usage_alerts_created_at_idx" ON "translation_usage_alerts" USING btree ("created_at");

    CREATE UNIQUE INDEX "tenantId_month_idx" ON "translation_usage_alerts" USING btree ("tenant_id", "month");

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_translation_usage_fk" FOREIGN KEY ("translation_usage_id") REFERENCES "public"."translation_usage" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_translation_usage_alerts_fk" FOREIGN KEY ("translation_usage_alerts_id") REFERENCES "public"."translation_usage_alerts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "payload_locked_documents_rels_translation_usage_id_idx" ON "payload_locked_documents_rels" USING btree ("translation_usage_id");

    CREATE INDEX "payload_locked_documents_rels_translation_usage_alerts_i_idx" ON "payload_locked_documents_rels" USING btree ("translation_usage_alerts_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "translation_usage" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "translation_usage_alerts" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_translation_usage_fk";

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_translation_usage_alerts_fk";

    DROP TABLE "translation_usage" CASCADE;

    DROP TABLE "translation_usage_alerts" CASCADE;

    DROP INDEX "payload_locked_documents_rels_translation_usage_id_idx";

    DROP INDEX "payload_locked_documents_rels_translation_usage_alerts_i_idx";

    ALTER TABLE "rds"
    DROP COLUMN "printable_directories_translation_alert_threshold_usd";

    ALTER TABLE "rds"
    DROP COLUMN "printable_directories_translation_user_quota_usd";

    ALTER TABLE "rds"
    DROP COLUMN "printable_directories_translation_tenant_cap_usd";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_printable_directories_translation_alert_threshold_usd";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_printable_directories_translation_user_quota_usd";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_printable_directories_translation_tenant_cap_usd";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "translation_usage_id";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "translation_usage_alerts_id";
  `);
}
