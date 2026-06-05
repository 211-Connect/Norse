import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_rds_search_card_layout_component_id"
    ADD VALUE 'attribution' BEFORE 'badges';

    ALTER TYPE "public"."enum__rds_v_version_search_card_layout_component_id"
    ADD VALUE 'attribution' BEFORE 'badges';
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_search_card_layout"
    ALTER COLUMN "component_id"
    SET DATA TYPE text;

    DROP TYPE "public"."enum_rds_search_card_layout_component_id";

    CREATE TYPE "public"."enum_rds_search_card_layout_component_id" AS ENUM(
      'badges',
      'resourceName',
      'serviceName',
      'address',
      'phone',
      'website',
      'description',
      'categories',
      'actionButtons',
      'separator',
      'customAttribute'
    );

    ALTER TABLE "rds_search_card_layout"
    ALTER COLUMN "component_id"
    SET DATA TYPE "public"."enum_rds_search_card_layout_component_id" USING "component_id"::"public"."enum_rds_search_card_layout_component_id";

    ALTER TABLE "_rds_v_version_search_card_layout"
    ALTER COLUMN "component_id"
    SET DATA TYPE text;

    DROP TYPE "public"."enum__rds_v_version_search_card_layout_component_id";

    CREATE TYPE "public"."enum__rds_v_version_search_card_layout_component_id" AS ENUM(
      'badges',
      'resourceName',
      'serviceName',
      'address',
      'phone',
      'website',
      'description',
      'categories',
      'actionButtons',
      'separator',
      'customAttribute'
    );

    ALTER TABLE "_rds_v_version_search_card_layout"
    ALTER COLUMN "component_id"
    SET DATA TYPE "public"."enum__rds_v_version_search_card_layout_component_id" USING "component_id"::"public"."enum__rds_v_version_search_card_layout_component_id";
  `);
}
