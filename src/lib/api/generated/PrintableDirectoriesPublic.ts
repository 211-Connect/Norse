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
  PrintableDirectoryPublicControllerPreviewData,
  PrintableDirectoryPublicControllerPreviewParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class PrintableDirectoriesPublic<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Fully public, unauthenticated endpoint intended for sharing a printable directory PDF via URL. The slug acts as a capability token: resolution ignores accessPolicy and is not restricted to the owner or tenant members, so it works even for private directories. Choose a non-guessable slug for directories that should not be discoverable.
   *
   * @tags Printable Directories (Public)
   * @name PrintableDirectoryPublicControllerPreview
   * @summary Build printable preview payload by public slug
   * @request GET:/printable-directories/public/{slug}/preview
   */
  printableDirectoryPublicControllerPreview = (
    { slug, ...query }: PrintableDirectoryPublicControllerPreviewParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryPublicControllerPreviewData, any>({
      path: `/printable-directories/public/${slug}/preview`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
