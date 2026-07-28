import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    ADD COLUMN "brand_printable_documents_cta_text" varchar;

    ALTER TABLE "_rds_v_locales"
    ADD COLUMN "version_brand_printable_documents_cta_text" varchar;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_locales"
    DROP COLUMN "brand_printable_documents_cta_text";

    ALTER TABLE "_rds_v_locales"
    DROP COLUMN "version_brand_printable_documents_cta_text";
  `);
}
