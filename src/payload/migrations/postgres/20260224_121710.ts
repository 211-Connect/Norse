import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" ADD COLUMN "search_search_settings_hybrid_semantic_search_enabled" boolean DEFAULT false;
  ALTER TABLE "_rds_v" ADD COLUMN "version_search_search_settings_hybrid_semantic_search_enabled" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "search_search_settings_hybrid_semantic_search_enabled";
  ALTER TABLE "_rds_v" DROP COLUMN "version_search_search_settings_hybrid_semantic_search_enabled";`)
}
