import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "tenants"
    ADD COLUMN IF NOT EXISTS "common_umami_website_id" varchar;

    ALTER TABLE "rds"
    DROP COLUMN IF EXISTS "feature_flags_use_hybrid_semantic_search";

    ALTER TABLE "_rds_v"
    DROP COLUMN IF EXISTS "version_feature_flags_use_hybrid_semantic_search";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN IF NOT EXISTS "feature_flags_use_hybrid_semantic_search" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN IF NOT EXISTS "version_feature_flags_use_hybrid_semantic_search" boolean DEFAULT FALSE;

    ALTER TABLE "tenants"
    DROP COLUMN IF EXISTS "common_umami_website_id";
  `);
}
