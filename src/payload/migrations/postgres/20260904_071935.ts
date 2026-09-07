import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_enable_organization_search" boolean DEFAULT FALSE;

    ALTER TABLE "rds"
    ADD COLUMN "feature_flags_show_suggestion_list_organization_location_badge" boolean DEFAULT FALSE;

    ALTER TABLE "rds_locales"
    ADD COLUMN "search_texts_suggestion_headers_organizations" varchar;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_enable_organization_search" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_feature_flags_show_suggestion_list_organization_location_badge" boolean DEFAULT FALSE;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_search_texts_suggestion_headers_organizations" varchar;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_enable_organization_search";

    ALTER TABLE "rds"
    DROP COLUMN "feature_flags_show_suggestion_list_organization_location_badge";

    ALTER TABLE "rds_locales"
    DROP COLUMN "search_texts_suggestion_headers_organizations";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_enable_organization_search";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_feature_flags_show_suggestion_list_organization_location_badge";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_search_texts_suggestion_headers_organizations";
  `);
}
