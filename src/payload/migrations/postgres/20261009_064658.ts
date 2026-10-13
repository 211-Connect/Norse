import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pd_user_groups_capabilities" AS ENUM(
      'logoUpload',
      'coverCustomization',
      'customHeadersFooters',
      'automaticTranslation',
      'scheduledPdfDelivery'
    );

    CREATE TYPE "public"."pd_access_mode" AS ENUM('everyone', 'allowlist');

    CREATE TYPE "public"."enum__pd_user_groups_v_capabilities" AS ENUM(
      'logoUpload',
      'coverCustomization',
      'customHeadersFooters',
      'automaticTranslation',
      'scheduledPdfDelivery'
    );

    CREATE TABLE "pd_group_emails" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar
    );

    CREATE TABLE "pd_group_domains" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "domain" varchar
    );

    CREATE TABLE "pd_user_groups_capabilities" (
      "order" integer NOT NULL,
      "parent_id" varchar NOT NULL,
      "value" "enum_pd_user_groups_capabilities",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE "pd_user_groups" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar
    );

    CREATE TABLE "_pd_group_emails_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar,
      "_uuid" varchar
    );

    CREATE TABLE "_pd_group_domains_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "domain" varchar,
      "_uuid" varchar
    );

    CREATE TABLE "_pd_user_groups_v_capabilities" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum__pd_user_groups_v_capabilities",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE "_pd_user_groups_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "rds"
    ADD COLUMN "printable_directories_access_mode" "pd_access_mode" DEFAULT 'allowlist';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_printable_directories_access_mode" "pd_access_mode" DEFAULT 'allowlist';

    ALTER TABLE "pd_group_emails"
    ADD CONSTRAINT "pd_group_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pd_user_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "pd_group_domains"
    ADD CONSTRAINT "pd_group_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pd_user_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "pd_user_groups_capabilities"
    ADD CONSTRAINT "pd_user_groups_capabilities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pd_user_groups" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "pd_user_groups"
    ADD CONSTRAINT "pd_user_groups_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_group_emails_v"
    ADD CONSTRAINT "_pd_group_emails_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pd_user_groups_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_group_domains_v"
    ADD CONSTRAINT "_pd_group_domains_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pd_user_groups_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_user_groups_v_capabilities"
    ADD CONSTRAINT "_pd_user_groups_v_capabilities_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pd_user_groups_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_user_groups_v"
    ADD CONSTRAINT "_pd_user_groups_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "pd_group_emails_order_idx" ON "pd_group_emails" USING btree ("_order");

    CREATE INDEX "pd_group_emails_parent_id_idx" ON "pd_group_emails" USING btree ("_parent_id");

    CREATE INDEX "pd_group_domains_order_idx" ON "pd_group_domains" USING btree ("_order");

    CREATE INDEX "pd_group_domains_parent_id_idx" ON "pd_group_domains" USING btree ("_parent_id");

    CREATE INDEX "pd_user_groups_capabilities_order_idx" ON "pd_user_groups_capabilities" USING btree ("order");

    CREATE INDEX "pd_user_groups_capabilities_parent_idx" ON "pd_user_groups_capabilities" USING btree ("parent_id");

    CREATE INDEX "pd_user_groups_order_idx" ON "pd_user_groups" USING btree ("_order");

    CREATE INDEX "pd_user_groups_parent_id_idx" ON "pd_user_groups" USING btree ("_parent_id");

    CREATE INDEX "_pd_group_emails_v_order_idx" ON "_pd_group_emails_v" USING btree ("_order");

    CREATE INDEX "_pd_group_emails_v_parent_id_idx" ON "_pd_group_emails_v" USING btree ("_parent_id");

    CREATE INDEX "_pd_group_domains_v_order_idx" ON "_pd_group_domains_v" USING btree ("_order");

    CREATE INDEX "_pd_group_domains_v_parent_id_idx" ON "_pd_group_domains_v" USING btree ("_parent_id");

    CREATE INDEX "_pd_user_groups_v_capabilities_order_idx" ON "_pd_user_groups_v_capabilities" USING btree ("order");

    CREATE INDEX "_pd_user_groups_v_capabilities_parent_idx" ON "_pd_user_groups_v_capabilities" USING btree ("parent_id");

    CREATE INDEX "_pd_user_groups_v_order_idx" ON "_pd_user_groups_v" USING btree ("_order");

    CREATE INDEX "_pd_user_groups_v_parent_id_idx" ON "_pd_user_groups_v" USING btree ("_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "pd_group_emails" CASCADE;

    DROP TABLE "pd_group_domains" CASCADE;

    DROP TABLE "pd_user_groups_capabilities" CASCADE;

    DROP TABLE "pd_user_groups" CASCADE;

    DROP TABLE "_pd_group_emails_v" CASCADE;

    DROP TABLE "_pd_group_domains_v" CASCADE;

    DROP TABLE "_pd_user_groups_v_capabilities" CASCADE;

    DROP TABLE "_pd_user_groups_v" CASCADE;

    ALTER TABLE "rds"
    DROP COLUMN "printable_directories_access_mode";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_printable_directories_access_mode";

    DROP TYPE "public"."enum_pd_user_groups_capabilities";

    DROP TYPE "public"."pd_access_mode";

    DROP TYPE "public"."enum__pd_user_groups_v_capabilities";
  `);
}
