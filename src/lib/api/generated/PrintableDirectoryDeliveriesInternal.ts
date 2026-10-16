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
  ClaimPrintableDirectoryDeliveryDto,
  PrintableDirectoryDeliveryInternalControllerClaimData,
  PrintableDirectoryDeliveryInternalControllerClaimParams,
  PrintableDirectoryDeliveryInternalControllerListDueData,
  PrintableDirectoryDeliveryInternalControllerListDueParams,
  PrintableDirectoryDeliveryInternalControllerPreviewData,
  PrintableDirectoryDeliveryInternalControllerPreviewParams,
  PrintableDirectoryDeliveryInternalControllerReportResultData,
  PrintableDirectoryDeliveryInternalControllerReportResultParams,
  ReportPrintableDirectoryDeliveryResultDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class PrintableDirectoryDeliveriesInternal<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Enabled deliveries of the tenant scheduled for the calendar date and not yet claimed for it.
   *
   * @tags Printable Directory Deliveries (Internal)
   * @name PrintableDirectoryDeliveryInternalControllerListDue
   * @summary List deliveries due on a date
   * @request GET:/internal/printable-directory-deliveries/due
   * @secure
   */
  printableDirectoryDeliveryInternalControllerListDue = (
    query: PrintableDirectoryDeliveryInternalControllerListDueParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryInternalControllerListDueData, any>({
      path: `/internal/printable-directory-deliveries/due`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Atomic: only the first claim for a date returns claimed=true, so a delivery is sent at most once per day.
   *
   * @tags Printable Directory Deliveries (Internal)
   * @name PrintableDirectoryDeliveryInternalControllerClaim
   * @summary Claim a delivery for a date
   * @request POST:/internal/printable-directory-deliveries/{deliveryId}/claim
   * @secure
   */
  printableDirectoryDeliveryInternalControllerClaim = (
    {
      deliveryId,
      ...query
    }: PrintableDirectoryDeliveryInternalControllerClaimParams,
    data: ClaimPrintableDirectoryDeliveryDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryInternalControllerClaimData, any>({
      path: `/internal/printable-directory-deliveries/${deliveryId}/claim`,
      method: "POST",
      query: query,
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Printable Directory Deliveries (Internal)
   * @name PrintableDirectoryDeliveryInternalControllerReportResult
   * @summary Record a delivery run's outcome
   * @request POST:/internal/printable-directory-deliveries/{deliveryId}/result
   * @secure
   */
  printableDirectoryDeliveryInternalControllerReportResult = (
    {
      deliveryId,
      ...query
    }: PrintableDirectoryDeliveryInternalControllerReportResultParams,
    data: ReportPrintableDirectoryDeliveryResultDto,
    params: RequestParams = {},
  ) =>
    this.request<
      PrintableDirectoryDeliveryInternalControllerReportResultData,
      any
    >({
      path: `/internal/printable-directory-deliveries/${deliveryId}/result`,
      method: "POST",
      query: query,
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * @description Resolves the directory's resources as its owner (favorites lists included). Defaults to the delivery's locale.
   *
   * @tags Printable Directory Deliveries (Internal)
   * @name PrintableDirectoryDeliveryInternalControllerPreview
   * @summary Build the delivery's directory preview
   * @request GET:/internal/printable-directory-deliveries/{deliveryId}/preview
   * @secure
   */
  printableDirectoryDeliveryInternalControllerPreview = (
    {
      deliveryId,
      ...query
    }: PrintableDirectoryDeliveryInternalControllerPreviewParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryInternalControllerPreviewData, any>({
      path: `/internal/printable-directory-deliveries/${deliveryId}/preview`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
}
