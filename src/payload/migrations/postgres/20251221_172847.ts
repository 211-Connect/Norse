import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_rds_accessibility_font_size_adjustment" AS ENUM('150%', '175%', '200%');
  CREATE TYPE "public"."enum__rds_v_version_accessibility_font_size_adjustment" AS ENUM('150%', '175%', '200%');
  ALTER TABLE "rds" ADD COLUMN "accessibility_font_size_adjustment" "enum_rds_accessibility_font_size_adjustment";
  ALTER TABLE "_rds_v" ADD COLUMN "version_accessibility_font_size_adjustment" "enum__rds_v_version_accessibility_font_size_adjustment";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "rds" DROP COLUMN "accessibility_font_size_adjustment";
  ALTER TABLE "_rds_v" DROP COLUMN "version_accessibility_font_size_adjustment";
  DROP TYPE "public"."enum_rds_accessibility_font_size_adjustment";
  DROP TYPE "public"."enum__rds_v_version_accessibility_font_size_adjustment";`)
}
