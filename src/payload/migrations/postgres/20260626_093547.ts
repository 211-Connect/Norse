import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_rds_search_texts_view_details_button_variant" AS ENUM('default', 'secondary', 'ghost', 'link');

    CREATE TYPE "public"."enum__rds_v_version_search_texts_view_details_button_variant" AS ENUM('default', 'secondary', 'ghost', 'link');

    ALTER TABLE "rds"
    ADD COLUMN "search_texts_view_details_button_variant" "enum_rds_search_texts_view_details_button_variant" DEFAULT 'ghost';

    ALTER TABLE "_rds_v"
    ADD COLUMN "version_search_texts_view_details_button_variant" "enum__rds_v_version_search_texts_view_details_button_variant" DEFAULT 'ghost';
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds"
    DROP COLUMN "search_texts_view_details_button_variant";

    ALTER TABLE "_rds_v"
    DROP COLUMN "version_search_texts_view_details_button_variant";

    DROP TYPE "public"."enum_rds_search_texts_view_details_button_variant";

    DROP TYPE "public"."enum__rds_v_version_search_texts_view_details_button_variant";
  `);
}
