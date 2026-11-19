import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "search_search_settings_v2_use_pinned_resources" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_search_settings_v2_use_pinned_resources" boolean DEFAULT TRUE;

    ALTER TABLE "hsc"
    DROP COLUMN "vector_score_weight";

    ALTER TABLE "hsc"
    DROP COLUMN "base_taxonomy_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "geo_gauss_weight";

    ALTER TABLE "hsc"
    DROP COLUMN "geo_default_scale_mi";

    ALTER TABLE "hsc"
    DROP COLUMN "pinned_score_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "priority_score_weight";

    ALTER TABLE "hsc"
    DROP COLUMN "bm25_name_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "bm25_service_name_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "bm25_org_name_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "bm25_taxonomy_use_ref_boost";

    ALTER TABLE "hsc"
    DROP COLUMN "taxonomy_k";

    ALTER TABLE "hsc"
    DROP COLUMN "taxonomy_num_candidates";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_vector_score_weight";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_base_taxonomy_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_geo_gauss_weight";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_geo_default_scale_mi";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_pinned_score_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_priority_score_weight";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_bm25_name_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_bm25_service_name_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_bm25_org_name_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_bm25_taxonomy_use_ref_boost";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_taxonomy_k";

    ALTER TABLE "_hsc_v"
    DROP COLUMN "version_taxonomy_num_candidates";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "hsc"
    ADD COLUMN "vector_score_weight" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "base_taxonomy_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "geo_gauss_weight" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "geo_default_scale_mi" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "pinned_score_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "priority_score_weight" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "bm25_name_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "bm25_service_name_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "bm25_org_name_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "bm25_taxonomy_use_ref_boost" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "taxonomy_k" numeric;

    ALTER TABLE "hsc"
    ADD COLUMN "taxonomy_num_candidates" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_vector_score_weight" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_base_taxonomy_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_geo_gauss_weight" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_geo_default_scale_mi" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_pinned_score_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_priority_score_weight" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_bm25_name_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_bm25_service_name_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_bm25_org_name_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_bm25_taxonomy_use_ref_boost" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_taxonomy_k" numeric;

    ALTER TABLE "_hsc_v"
    ADD COLUMN "version_taxonomy_num_candidates" numeric;

    ALTER TABLE "rds"
    DROP COLUMN "search_search_settings_v2_use_pinned_resources";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_search_settings_v2_use_pinned_resources";
  `);
}
