import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "pd_allow_emails" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "email" varchar
    );

    CREATE TABLE "pd_allow_domains" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "domain" varchar
    );

    CREATE TABLE "_pd_allow_emails_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar,
      "_uuid" varchar
    );

    CREATE TABLE "_pd_allow_domains_v" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "domain" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_enable_printable_directories" boolean DEFAULT FALSE;

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_max_resources_configurable" boolean DEFAULT TRUE;

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_default_max_resources" numeric DEFAULT 100;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_enable_printable_directories" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_max_resources_configurable" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_default_max_resources" numeric DEFAULT 100;

    ALTER TABLE "pd_allow_emails"
    ADD CONSTRAINT "pd_allow_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "pd_allow_domains"
    ADD CONSTRAINT "pd_allow_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."rds" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_allow_emails_v"
    ADD CONSTRAINT "_pd_allow_emails_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    ALTER TABLE "_pd_allow_domains_v"
    ADD CONSTRAINT "_pd_allow_domains_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_rds_v" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "pd_allow_emails_order_idx" ON "pd_allow_emails" USING btree ("_order");

    CREATE INDEX "pd_allow_emails_parent_id_idx" ON "pd_allow_emails" USING btree ("_parent_id");

    CREATE INDEX "pd_allow_domains_order_idx" ON "pd_allow_domains" USING btree ("_order");

    CREATE INDEX "pd_allow_domains_parent_id_idx" ON "pd_allow_domains" USING btree ("_parent_id");

    CREATE INDEX "_pd_allow_emails_v_order_idx" ON "_pd_allow_emails_v" USING btree ("_order");

    CREATE INDEX "_pd_allow_emails_v_parent_id_idx" ON "_pd_allow_emails_v" USING btree ("_parent_id");

    CREATE INDEX "_pd_allow_domains_v_order_idx" ON "_pd_allow_domains_v" USING btree ("_order");

    CREATE INDEX "_pd_allow_domains_v_parent_id_idx" ON "_pd_allow_domains_v" USING btree ("_parent_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "pd_allow_emails" CASCADE;

    DROP TABLE "pd_allow_domains" CASCADE;

    DROP TABLE "_pd_allow_emails_v" CASCADE;

    DROP TABLE "_pd_allow_domains_v" CASCADE;

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_enable_printable_directories";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_max_resources_configurable";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_default_max_resources";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_enable_printable_directories";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_max_resources_configurable";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_default_max_resources";
  `);
}
