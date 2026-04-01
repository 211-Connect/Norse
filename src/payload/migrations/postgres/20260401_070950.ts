import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tenants_sms_sms_provider" AS ENUM('Twilio', 'EMS');
  ALTER TABLE "tenants" ADD COLUMN "sms_sms_provider" "enum_tenants_sms_sms_provider";
  ALTER TABLE "tenants" ADD COLUMN "sms_twilio_phone_number" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_twilio_api_key" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_twilio_api_key_sid" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_twilio_account_sid" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_ems_api_key" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_ems_short_code" varchar;
  ALTER TABLE "tenants" ADD COLUMN "sms_ems_keyword" varchar;

  UPDATE "tenants"
  SET
    "sms_twilio_phone_number" = "twilio_phone_number",
    "sms_twilio_api_key" = "twilio_api_key",
    "sms_twilio_api_key_sid" = "twilio_api_key_sid",
    "sms_twilio_account_sid" = "twilio_account_sid";
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "tenants" DROP COLUMN "sms_sms_provider";
  ALTER TABLE "tenants" DROP COLUMN "sms_twilio_phone_number";
  ALTER TABLE "tenants" DROP COLUMN "sms_twilio_api_key";
  ALTER TABLE "tenants" DROP COLUMN "sms_twilio_api_key_sid";
  ALTER TABLE "tenants" DROP COLUMN "sms_twilio_account_sid";
  ALTER TABLE "tenants" DROP COLUMN "sms_ems_api_key";
  ALTER TABLE "tenants" DROP COLUMN "sms_ems_short_code";
  ALTER TABLE "tenants" DROP COLUMN "sms_ems_keyword";
  DROP TYPE "public"."enum_tenants_sms_sms_provider";`);
}
