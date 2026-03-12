import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "feature_flags_use_hybrid_semantic_search";
  ALTER TABLE "_rds_v" DROP COLUMN "version_feature_flags_use_hybrid_semantic_search";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "feature_flags_use_hybrid_semantic_search" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_feature_flags_use_hybrid_semantic_search" boolean DEFAULT false;`)
}
