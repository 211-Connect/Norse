import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "tenant_media" ADD COLUMN "_objectkey" varchar;
  CREATE INDEX "rds_common_alert_locales_parent_id_idx" ON "rds_common_alert_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_suggestions_locales_parent_id_idx" ON "rds_suggestions_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_topics_list_subtopics_locales_parent_id_idx" ON "rds_topics_list_subtopics_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_topics_list_locales_parent_id_idx" ON "rds_topics_list_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_highlights_items_locales_parent_id_idx" ON "rds_highlights_items_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_badges_list_locales_parent_id_idx" ON "rds_badges_list_locales" USING btree ("_parent_id");
  CREATE INDEX "left_col_items_locales_parent_id_idx" ON "left_col_items_locales" USING btree ("_parent_id");
  CREATE INDEX "right_col_items_locales_parent_id_idx" ON "right_col_items_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_search_facets_locales_parent_id_idx" ON "rds_search_facets_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_search_card_layout_locales_parent_id_idx" ON "rds_search_card_layout_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_new_layout_callouts_options_locales_parent_id_idx" ON "rds_new_layout_callouts_options_locales" USING btree ("_parent_id");
  CREATE INDEX "rds_locales_parent_id_idx" ON "rds_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_common_alert_locales_parent_id_idx" ON "_rds_v_version_common_alert_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_suggestions_locales_parent_id_idx" ON "_rds_v_version_suggestions_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_topics_list_subtopics_locales_parent_id_idx" ON "_rds_v_version_topics_list_subtopics_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_topics_list_locales_parent_id_idx" ON "_rds_v_version_topics_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_highlights_items_locales_parent_id_idx" ON "_rds_v_version_highlights_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_badges_list_locales_parent_id_idx" ON "_rds_v_version_badges_list_locales" USING btree ("_parent_id");
  CREATE INDEX "_left_col_v_items_locales_parent_id_idx" ON "_left_col_v_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_right_col_v_items_locales_parent_id_idx" ON "_right_col_v_items_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_search_facets_locales_parent_id_idx" ON "_rds_v_version_search_facets_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_search_card_layout_locales_parent_id_idx" ON "_rds_v_version_search_card_layout_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_version_new_layout_callouts_options_locales_paren_idx" ON "_rds_v_version_new_layout_callouts_options_locales" USING btree ("_parent_id");
  CREATE INDEX "_rds_v_locales_parent_id_idx" ON "_rds_v_locales" USING btree ("_parent_id");
  CREATE INDEX "oc_schemas_custom_attributes_locales_parent_id_idx" ON "oc_schemas_custom_attributes_locales" USING btree ("_parent_id");
  CREATE INDEX "_oc_v_version_schemas_custom_attributes_locales_parent_i_idx" ON "_oc_v_version_schemas_custom_attributes_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "rds_common_alert_locales_parent_id_idx";
  DROP INDEX "rds_suggestions_locales_parent_id_idx";
  DROP INDEX "rds_topics_list_subtopics_locales_parent_id_idx";
  DROP INDEX "rds_topics_list_locales_parent_id_idx";
  DROP INDEX "rds_highlights_items_locales_parent_id_idx";
  DROP INDEX "rds_badges_list_locales_parent_id_idx";
  DROP INDEX "left_col_items_locales_parent_id_idx";
  DROP INDEX "right_col_items_locales_parent_id_idx";
  DROP INDEX "rds_search_facets_locales_parent_id_idx";
  DROP INDEX "rds_search_card_layout_locales_parent_id_idx";
  DROP INDEX "rds_new_layout_callouts_options_locales_parent_id_idx";
  DROP INDEX "rds_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_common_alert_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_suggestions_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_topics_list_subtopics_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_topics_list_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_highlights_items_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_badges_list_locales_parent_id_idx";
  DROP INDEX "_left_col_v_items_locales_parent_id_idx";
  DROP INDEX "_right_col_v_items_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_search_facets_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_search_card_layout_locales_parent_id_idx";
  DROP INDEX "_rds_v_version_new_layout_callouts_options_locales_paren_idx";
  DROP INDEX "_rds_v_locales_parent_id_idx";
  DROP INDEX "oc_schemas_custom_attributes_locales_parent_id_idx";
  DROP INDEX "_oc_v_version_schemas_custom_attributes_locales_parent_i_idx";
  ALTER TABLE "users" DROP COLUMN "reset_password_requested_at";
  ALTER TABLE "tenant_media" DROP COLUMN "_objectkey";`)
}
