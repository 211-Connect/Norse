import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "tenants" DROP COLUMN "twilio_phone_number";
  ALTER TABLE "tenants" DROP COLUMN "twilio_api_key";
  ALTER TABLE "tenants" DROP COLUMN "twilio_api_key_sid";
  ALTER TABLE "tenants" DROP COLUMN "twilio_account_sid";
  ALTER TABLE "rds" DROP COLUMN "common_sms_provider";
  ALTER TABLE "_rds_v" DROP COLUMN "version_common_sms_provider";
  DROP TYPE "public"."enum_rds_common_sms_provider";
  DROP TYPE "public"."enum__rds_v_version_common_sms_provider";`);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_rds_common_sms_provider" AS ENUM('Twilio');
  CREATE TYPE "public"."enum__rds_v_version_common_sms_provider" AS ENUM('Twilio');
  ALTER TABLE "tenants" ADD COLUMN "twilio_phone_number" varchar;
  ALTER TABLE "tenants" ADD COLUMN "twilio_api_key" varchar;
  ALTER TABLE "tenants" ADD COLUMN "twilio_api_key_sid" varchar;
  ALTER TABLE "tenants" ADD COLUMN "twilio_account_sid" varchar;
  ALTER TABLE "rds" ADD COLUMN "common_sms_provider" "enum_rds_common_sms_provider";
  ALTER TABLE "_rds_v" ADD COLUMN "version_common_sms_provider" "enum__rds_v_version_common_sms_provider";`);
}
