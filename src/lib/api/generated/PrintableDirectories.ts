/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

import {
  CreatePrintableDirectoryDto,
  CreatePrintableDirectorySectionDto,
  PrintableDirectoryControllerCreateData,
  PrintableDirectoryControllerCreateParams,
  PrintableDirectoryControllerCreateSectionData,
  PrintableDirectoryControllerCreateSectionParams,
  PrintableDirectoryControllerCreateSourceData,
  PrintableDirectoryControllerCreateSourceParams,
  PrintableDirectoryControllerCreateSourcePayload,
  PrintableDirectoryControllerGetByIdData,
  PrintableDirectoryControllerGetByIdParams,
  PrintableDirectoryControllerListData,
  PrintableDirectoryControllerListParams,
  PrintableDirectoryControllerPreviewData,
  PrintableDirectoryControllerPreviewParams,
  PrintableDirectoryControllerRemoveData,
  PrintableDirectoryControllerRemoveParams,
  PrintableDirectoryControllerRemoveSectionData,
  PrintableDirectoryControllerRemoveSectionParams,
  PrintableDirectoryControllerRemoveSourceData,
  PrintableDirectoryControllerRemoveSourceParams,
  PrintableDirectoryControllerReorderSectionsData,
  PrintableDirectoryControllerReorderSectionsParams,
  PrintableDirectoryControllerReorderSourcesData,
  PrintableDirectoryControllerReorderSourcesParams,
  PrintableDirectoryControllerUpdateData,
  PrintableDirectoryControllerUpdateParams,
  PrintableDirectoryControllerUpdateSectionData,
  PrintableDirectoryControllerUpdateSectionParams,
  PrintableDirectoryControllerUpdateSourceData,
  PrintableDirectoryControllerUpdateSourceParams,
  ReorderPrintableDirectorySectionsDto,
  ReorderPrintableDirectorySourcesDto,
  UpdatePrintableDirectoryDto,
  UpdatePrintableDirectorySectionDto,
  UpdatePrintableDirectorySourceDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class PrintableDirectories<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Returns paginated printable directories for the authenticated user in the current tenant.
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerList
   * @summary List printable directories
   * @request GET:/printable-directories
   */
  printableDirectoryControllerList = (
    query: PrintableDirectoryControllerListParams = {},
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerListData, any>({
      path: `/printable-directories`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerCreate
   * @request POST:/printable-directories
   */
  printableDirectoryControllerCreate = (
    data: CreatePrintableDirectoryDto,
    query: PrintableDirectoryControllerCreateParams = {},
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerCreateData, any>({
      path: `/printable-directories`,
      method: "POST",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * @description Access policy is enforced by directory configuration: private, shared-read, or shared-edit.
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerGetById
   * @summary Get printable directory
   * @request GET:/printable-directories/{id}
   */
  printableDirectoryControllerGetById = (
    { id, ...query }: PrintableDirectoryControllerGetByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerGetByIdData, any>({
      path: `/printable-directories/${id}`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerUpdate
   * @request PATCH:/printable-directories/{id}
   */
  printableDirectoryControllerUpdate = (
    { id, ...query }: PrintableDirectoryControllerUpdateParams,
    data: UpdatePrintableDirectoryDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerUpdateData, any>({
      path: `/printable-directories/${id}`,
      method: "PATCH",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerRemove
   * @request DELETE:/printable-directories/{id}
   */
  printableDirectoryControllerRemove = (
    { id, ...query }: PrintableDirectoryControllerRemoveParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerRemoveData, any>({
      path: `/printable-directories/${id}`,
      method: "DELETE",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerCreateSection
   * @request POST:/printable-directories/{id}/sections
   */
  printableDirectoryControllerCreateSection = (
    { id, ...query }: PrintableDirectoryControllerCreateSectionParams,
    data: CreatePrintableDirectorySectionDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerCreateSectionData, any>({
      path: `/printable-directories/${id}/sections`,
      method: "POST",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerReorderSections
   * @request PATCH:/printable-directories/{id}/sections/reorder
   */
  printableDirectoryControllerReorderSections = (
    { id, ...query }: PrintableDirectoryControllerReorderSectionsParams,
    data: ReorderPrintableDirectorySectionsDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerReorderSectionsData, any>({
      path: `/printable-directories/${id}/sections/reorder`,
      method: "PATCH",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerUpdateSection
   * @request PATCH:/printable-directories/{id}/sections/{sectionId}
   */
  printableDirectoryControllerUpdateSection = (
    {
      id,
      sectionId,
      ...query
    }: PrintableDirectoryControllerUpdateSectionParams,
    data: UpdatePrintableDirectorySectionDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerUpdateSectionData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}`,
      method: "PATCH",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerRemoveSection
   * @request DELETE:/printable-directories/{id}/sections/{sectionId}
   */
  printableDirectoryControllerRemoveSection = (
    {
      id,
      sectionId,
      ...query
    }: PrintableDirectoryControllerRemoveSectionParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerRemoveSectionData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}`,
      method: "DELETE",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerCreateSource
   * @request POST:/printable-directories/{id}/sections/{sectionId}/sources
   */
  printableDirectoryControllerCreateSource = (
    { id, sectionId, ...query }: PrintableDirectoryControllerCreateSourceParams,
    data: PrintableDirectoryControllerCreateSourcePayload,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerCreateSourceData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}/sources`,
      method: "POST",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerReorderSources
   * @request PATCH:/printable-directories/{id}/sections/{sectionId}/sources/reorder
   */
  printableDirectoryControllerReorderSources = (
    {
      id,
      sectionId,
      ...query
    }: PrintableDirectoryControllerReorderSourcesParams,
    data: ReorderPrintableDirectorySourcesDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerReorderSourcesData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}/sources/reorder`,
      method: "PATCH",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerUpdateSource
   * @request PATCH:/printable-directories/{id}/sections/{sectionId}/sources/{sourceId}
   */
  printableDirectoryControllerUpdateSource = (
    {
      id,
      sectionId,
      sourceId,
      ...query
    }: PrintableDirectoryControllerUpdateSourceParams,
    data: UpdatePrintableDirectorySourceDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerUpdateSourceData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}/sources/${sourceId}`,
      method: "PATCH",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerRemoveSource
   * @request DELETE:/printable-directories/{id}/sections/{sectionId}/sources/{sourceId}
   */
  printableDirectoryControllerRemoveSource = (
    {
      id,
      sectionId,
      sourceId,
      ...query
    }: PrintableDirectoryControllerRemoveSourceParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerRemoveSourceData, any>({
      path: `/printable-directories/${id}/sections/${sectionId}/sources/${sourceId}`,
      method: "DELETE",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Resolves all section resources fresh at request time. No resource snapshots are persisted in directory documents.
   *
   * @tags Printable Directories
   * @name PrintableDirectoryControllerPreview
   * @summary Build printable preview payload
   * @request GET:/printable-directories/{id}/preview
   */
  printableDirectoryControllerPreview = (
    { id, ...query }: PrintableDirectoryControllerPreviewParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryControllerPreviewData, any>({
      path: `/printable-directories/${id}/preview`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
