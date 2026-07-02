import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_rds_search_facets_sort_by"
    ADD VALUE 'dayOfWeek';

    ALTER TYPE "public"."enum__rds_v_version_search_facets_sort_by"
    ADD VALUE 'dayOfWeek';
  `);
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "rds_search_facets"
    ALTER COLUMN "sort_by"
    SET DATA TYPE text;

    ALTER TABLE "rds_search_facets"
    ALTER COLUMN "sort_by"
    SET DEFAULT 'count'::text;

    DROP TYPE "public"."enum_rds_search_facets_sort_by";

    CREATE TYPE "public"."enum_rds_search_facets_sort_by" AS ENUM('count', 'name', 'valueOrder');

    ALTER TABLE "rds_search_facets"
    ALTER COLUMN "sort_by"
    SET DEFAULT 'count'::"public"."enum_rds_search_facets_sort_by";

    ALTER TABLE "rds_search_facets"
    ALTER COLUMN "sort_by"
    SET DATA TYPE "public"."enum_rds_search_facets_sort_by" USING "sort_by"::"public"."enum_rds_search_facets_sort_by";

    ALTER TABLE "_rds_v_version_search_facets"
    ALTER COLUMN "sort_by"
    SET DATA TYPE text;

    ALTER TABLE "_rds_v_version_search_facets"
    ALTER COLUMN "sort_by"
    SET DEFAULT 'count'::text;

    DROP TYPE "public"."enum__rds_v_version_search_facets_sort_by";

    CREATE TYPE "public"."enum__rds_v_version_search_facets_sort_by" AS ENUM('count', 'name', 'valueOrder');

    ALTER TABLE "_rds_v_version_search_facets"
    ALTER COLUMN "sort_by"
    SET DEFAULT 'count'::"public"."enum__rds_v_version_search_facets_sort_by";

    ALTER TABLE "_rds_v_version_search_facets"
    ALTER COLUMN "sort_by"
    SET DATA TYPE "public"."enum__rds_v_version_search_facets_sort_by" USING "sort_by"::"public"."enum__rds_v_version_search_facets_sort_by";
  `);
}
