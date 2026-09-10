import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The `Analytics` collection was removed from the Payload config, but the
  // migration that removed it never dropped the underlying DB objects
  // (see 20260319_124914.ts, which added them). This leaves stale
  // `analytics_id` references on `payload_locked_documents_rels` and an
  // orphaned `analytics` table on any DB migrated from before that removal,
  // which trips the `payload migrate` / dev-mode schema-push data-loss
  // warning. Drop them here so the schema matches current snapshots.
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
    DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_analytics_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_analytics_id_idx";

    ALTER TABLE "payload_locked_documents_rels"
    DROP COLUMN IF EXISTS "analytics_id";

    DROP TABLE IF EXISTS "analytics" CASCADE;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op: the `Analytics` collection no longer exists in
  // code, so there is nothing to recreate it against.
}
