import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oc_schemas_custom_attributes" RENAME COLUMN "origin" TO "provenance";
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" RENAME COLUMN "origin" TO "provenance";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "oc_schemas_custom_attributes" RENAME COLUMN "provenance" TO "origin";
  ALTER TABLE "_oc_v_version_schemas_custom_attributes" RENAME COLUMN "provenance" TO "origin";`)
}
