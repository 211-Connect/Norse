import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Step 1: create the new additional-website-ids table and add the scalar column.
  // Both are purely additive — safe to run against a live cluster.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tenants_analytics_additional_website_ids" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "website_id" varchar NOT NULL
    );

    ALTER TABLE "tenants"
    ADD COLUMN IF NOT EXISTS "analytics_umami_website_id" varchar;

    ALTER TABLE "tenants_analytics_additional_website_ids"
    ADD CONSTRAINT "tenants_analytics_additional_website_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    CREATE INDEX IF NOT EXISTS "tenants_analytics_additional_website_ids_order_idx" ON "tenants_analytics_additional_website_ids" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "tenants_analytics_additional_website_ids_parent_id_idx" ON "tenants_analytics_additional_website_ids" USING btree ("_parent_id");
  `);

  // Step 2: data migration.
  //
  // The previous migration (20260511_121351) moved the scalar common_umami_website_id
  // into the tenants_common_umami_website_ids array table. Each tenant's first row
  // (lowest _order) in that table becomes the new scalar analytics_umami_website_id.
  // Remaining rows (if any) are copied into the new additional table.
  //
  // This is safe to re-run: the UPDATE is guarded by IS NULL / = '' and the INSERT
  // uses ON CONFLICT DO NOTHING.
  await db.execute(sql`
    -- Promote the first row from the common table into the new scalar column
    UPDATE "tenants" t
    SET
      "analytics_umami_website_id" = sub."website_id"
    FROM
      (
        SELECT DISTINCT
          ON ("_parent_id") "_parent_id",
          "website_id"
        FROM
          "tenants_common_umami_website_ids"
        ORDER BY
          "_parent_id",
          "_order" ASC
      ) sub
    WHERE
      t."id" = sub."_parent_id"
      AND (
        t."analytics_umami_website_id" IS NULL
        OR t."analytics_umami_website_id" = ''
      );

    -- Copy any remaining rows (order >= 2) into the new additional table
    INSERT INTO
      "tenants_analytics_additional_website_ids" ("_order", "_parent_id", "id", "website_id")
    SELECT
      ROW_NUMBER() OVER (
        PARTITION BY
          "_parent_id"
        ORDER BY
          "_order"
      ) AS "_order",
      "_parent_id",
      "id",
      "website_id"
    FROM
      "tenants_common_umami_website_ids" src
    WHERE
      NOT EXISTS (
        -- exclude the first row that was promoted to the scalar column
        SELECT
          1
        FROM
          (
            SELECT DISTINCT
              ON ("_parent_id") "id"
            FROM
              "tenants_common_umami_website_ids"
            ORDER BY
              "_parent_id",
              "_order" ASC
          ) first_rows
        WHERE
          first_rows."id" = src."id"
      )
    ON CONFLICT ("id") DO NOTHING;
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  // Reverse order of up():
  //   1. Move data back into tenants_common_umami_website_ids
  //   2. Clear / drop the new structures
  //
  // NOTE: This restores structure but not the original row IDs from the common table —
  // rows that were in the common table and are now in the additional table keep their
  // existing IDs. The scalar column value is re-inserted as order=1.

  // Step 1: re-insert the scalar value as the first row in the common table
  await db.execute(sql`
    INSERT INTO
      "tenants_common_umami_website_ids" ("_order", "_parent_id", "id", "website_id")
    SELECT
      1,
      t."id",
      t."id" || '-legacy-umami-website-id',
      t."analytics_umami_website_id"
    FROM
      "tenants" t
    WHERE
      t."analytics_umami_website_id" IS NOT NULL
      AND t."analytics_umami_website_id" <> ''
    ON CONFLICT ("id") DO NOTHING;

    -- Re-insert any additional rows back into the common table, renumbering after the promoted row
    INSERT INTO
      "tenants_common_umami_website_ids" ("_order", "_parent_id", "id", "website_id")
    SELECT
      1 + ROW_NUMBER() OVER (
        PARTITION BY
          "_parent_id"
        ORDER BY
          "_order"
      ) AS "_order",
      "_parent_id",
      "id",
      "website_id"
    FROM
      "tenants_analytics_additional_website_ids"
    ON CONFLICT ("id") DO NOTHING;

    -- Renumber all rows in the common table so _order is contiguous starting at 1
    UPDATE "tenants_common_umami_website_ids" a
    SET
      "_order" = sub.new_order
    FROM
      (
        SELECT
          "id",
          ROW_NUMBER() OVER (
            PARTITION BY
              "_parent_id"
            ORDER BY
              "_order"
          ) AS new_order
        FROM
          "tenants_common_umami_website_ids"
      ) sub
    WHERE
      a."id" = sub."id";
  `);

  // Step 2: drop the new column and table (column must be dropped before table for clarity,
  // but neither references the other so order does not matter technically)
  await db.execute(sql`
    ALTER TABLE "tenants"
    DROP COLUMN IF EXISTS "analytics_umami_website_id";

    DROP TABLE IF EXISTS "tenants_analytics_additional_website_ids" CASCADE;
  `);
}
