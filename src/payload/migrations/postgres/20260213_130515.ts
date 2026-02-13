import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_search_facets" ADD COLUMN "show_in_details" boolean DEFAULT true;
  ALTER TABLE "_rds_v_version_search_facets" ADD COLUMN "show_in_details" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds_search_facets" DROP COLUMN "show_in_details";
  ALTER TABLE "_rds_v_version_search_facets" DROP COLUMN "show_in_details";`)
}
