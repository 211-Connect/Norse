import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "hsc" (
      "id" varchar PRIMARY KEY NOT NULL,
      "tenant_id" varchar,
      "vector_score_weight" numeric,
      "base_taxonomy_boost" numeric,
      "geo_gauss_weight" numeric,
      "geo_default_scale_mi" numeric,
      "pinned_score_boost" numeric,
      "priority_score_weight" numeric,
      "bm25_name_boost" numeric,
      "bm25_service_name_boost" numeric,
      "bm25_org_name_boost" numeric,
      "bm25_taxonomy_use_ref_boost" numeric,
      "taxonomy_k" numeric,
      "taxonomy_num_candidates" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE "_hsc_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" varchar,
      "version_tenant_id" varchar,
      "version_vector_score_weight" numeric,
      "version_base_taxonomy_boost" numeric,
      "version_geo_gauss_weight" numeric,
      "version_geo_default_scale_mi" numeric,
      "version_pinned_score_boost" numeric,
      "version_priority_score_weight" numeric,
      "version_bm25_name_boost" numeric,
      "version_bm25_service_name_boost" numeric,
      "version_bm25_org_name_boost" numeric,
      "version_bm25_taxonomy_use_ref_boost" numeric,
      "version_taxonomy_k" numeric,
      "version_taxonomy_num_candidates" numeric,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_boost_pinned_resources" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_boost_pinned_resources" boolean DEFAULT TRUE;

    ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN "hsc_id" varchar;

    ALTER TABLE "hsc"
    ADD CONSTRAINT "hsc_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_hsc_v"
    ADD CONSTRAINT "_hsc_v_parent_id_hsc_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hsc" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    ALTER TABLE "_hsc_v"
    ADD CONSTRAINT "_hsc_v_version_tenant_id_tenants_id_fk" FOREIGN KEY ("version_tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    CREATE UNIQUE INDEX "hsc_tenant_idx" ON "hsc" USING btree ("tenant_id");

    CREATE INDEX "hsc_updated_at_idx" ON "hsc" USING btree ("updated_at");

    CREATE INDEX "hsc_created_at_idx" ON "hsc" USING btree ("created_at");

    CREATE INDEX "_hsc_v_parent_idx" ON "_hsc_v" USING btree ("parent_id");

    CREATE INDEX "_hsc_v_version_version_tenant_idx" ON "_hsc_v" USING btree ("version_tenant_id");

    CREATE INDEX "_hsc_v_version_version_updated_at_idx" ON "_hsc_v" USING btree ("version_updated_at");

    CREATE INDEX "_hsc_v_version_version_created_at_idx" ON "_hsc_v" USING btree ("version_created_at");

    CREATE INDEX "_hsc_v_created_at_idx" ON "_hsc_v" USING btree ("created_at");

    CREATE INDEX "_hsc_v_updated_at_idx" ON "_hsc_v" USING btree ("updated_at");

    ALTER TABLE "payload_locked_documents_rels"
    ADD CONSTRAINT "payload_locked_documents_rels_hybrid_search_config_fk" FOREIGN KEY ("hsc_id") REFERENCES "public"."hsc" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX "payload_locked_documents_rels_hsc_id_idx" ON "payload_locked_documents_rels" USING btree ("hsc_id");
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hsc" DISABLE ROW LEVEL SECURITY;

    ALTER TABLE "_hsc_v" DISABLE ROW LEVEL SECURITY;

    DROP TABLE "hsc" CASCADE;

    DROP TABLE "_hsc_v" CASCADE;

    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT "payload_locked_documents_rels_hybrid_search_config_fk";

    DROP INDEX "payload_locked_documents_rels_hsc_id_idx";

    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_boost_pinned_resources";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_boost_pinned_resources";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN "hsc_id";
  `);
}
