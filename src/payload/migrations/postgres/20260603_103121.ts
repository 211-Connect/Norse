import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_left_col_items_component_id" ADD VALUE 'quality' BEFORE 'facets';
  ALTER TYPE "public"."enum_right_col_items_component_id" ADD VALUE 'quality' BEFORE 'facets';
  ALTER TYPE "public"."enum__left_col_v_items_component_id" ADD VALUE 'quality' BEFORE 'facets';
  ALTER TYPE "public"."enum__right_col_v_items_component_id" ADD VALUE 'quality' BEFORE 'facets';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "left_col_items" ALTER COLUMN "component_id" SET DATA TYPE text;
  DROP TYPE "public"."enum_left_col_items_component_id";
  CREATE TYPE "public"."enum_left_col_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'locationName', 'locationNameSubtitle', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'contacts', 'phoneNumbers', 'website', 'organizationUrl', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  ALTER TABLE "left_col_items" ALTER COLUMN "component_id" SET DATA TYPE "public"."enum_left_col_items_component_id" USING "component_id"::"public"."enum_left_col_items_component_id";
  ALTER TABLE "right_col_items" ALTER COLUMN "component_id" SET DATA TYPE text;
  DROP TYPE "public"."enum_right_col_items_component_id";
  CREATE TYPE "public"."enum_right_col_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'locationName', 'locationNameSubtitle', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'contacts', 'phoneNumbers', 'website', 'organizationUrl', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  ALTER TABLE "right_col_items" ALTER COLUMN "component_id" SET DATA TYPE "public"."enum_right_col_items_component_id" USING "component_id"::"public"."enum_right_col_items_component_id";
  ALTER TABLE "_left_col_v_items" ALTER COLUMN "component_id" SET DATA TYPE text;
  DROP TYPE "public"."enum__left_col_v_items_component_id";
  CREATE TYPE "public"."enum__left_col_v_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'locationName', 'locationNameSubtitle', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'contacts', 'phoneNumbers', 'website', 'organizationUrl', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  ALTER TABLE "_left_col_v_items" ALTER COLUMN "component_id" SET DATA TYPE "public"."enum__left_col_v_items_component_id" USING "component_id"::"public"."enum__left_col_v_items_component_id";
  ALTER TABLE "_right_col_v_items" ALTER COLUMN "component_id" SET DATA TYPE text;
  DROP TYPE "public"."enum__right_col_v_items_component_id";
  CREATE TYPE "public"."enum__right_col_v_items_component_id" AS ENUM('badges', 'resourceName', 'serviceName', 'locationName', 'locationNameSubtitle', 'address', 'transportation', 'accessibility', 'eligibility', 'requiredDocuments', 'hours', 'contacts', 'phoneNumbers', 'website', 'organizationUrl', 'email', 'languages', 'interpretationServices', 'applicationProcess', 'fees', 'serviceArea', 'description', 'categories', 'lastAssured', 'attribution', 'map', 'getDirections', 'organization', 'facets', 'separator', 'customAttribute');
  ALTER TABLE "_right_col_v_items" ALTER COLUMN "component_id" SET DATA TYPE "public"."enum__right_col_v_items_component_id" USING "component_id"::"public"."enum__right_col_v_items_component_id";`)
}
