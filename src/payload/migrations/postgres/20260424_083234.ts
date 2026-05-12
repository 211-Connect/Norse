import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oc_schemas_custom_attributes" ADD COLUMN "source_table" varchar;
  ALTER TABLE "oc_schemas_custom_attributes" ADD COLUMN "translate_label" boolean DEFAULT false;
  ALTER TABLE "oc_schemas_custom_attributes" ADD COLUMN "translate_value" boolean DEFAULT false;
  UPDATE "oc_schemas_custom_attributes"
  SET "source_table" = COALESCE("source_column", '')
  WHERE "source_table" IS NULL;
  ALTER TABLE "oc_schemas_custom_attributes" ALTER COLUMN "source_table" SET NOT NULL;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" ADD COLUMN "source_table" varchar;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" ADD COLUMN "translate_label" boolean DEFAULT false;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" ADD COLUMN "translate_value" boolean DEFAULT false;
  UPDATE "_oc_v_version_schemas_custom_attributes"
  SET "source_table" = COALESCE("source_column", '')
  WHERE "source_table" IS NULL;
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" ALTER COLUMN "source_table" SET NOT NULL;`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oc_schemas_custom_attributes" DROP COLUMN "source_table";
  ALTER TABLE "oc_schemas_custom_attributes" DROP COLUMN "translate_label";
  ALTER TABLE "oc_schemas_custom_attributes" DROP COLUMN "translate_value";
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" DROP COLUMN "source_table";
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" DROP COLUMN "translate_label";
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" DROP COLUMN "translate_value";`);
}
