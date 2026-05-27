import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_turn_resource_card_taxonomies_into_links" boolean DEFAULT TRUE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_turn_resource_card_taxonomies_into_links" boolean DEFAULT TRUE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_turn_resource_card_taxonomies_into_links";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_turn_resource_card_taxonomies_into_links";
  `);
}
