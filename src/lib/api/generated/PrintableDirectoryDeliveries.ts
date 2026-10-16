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
  CreatePrintableDirectoryDeliveryDto,
  PrintableDirectoryDeliveryControllerCreateData,
  PrintableDirectoryDeliveryControllerCreateParams,
  PrintableDirectoryDeliveryControllerListData,
  PrintableDirectoryDeliveryControllerListParams,
  PrintableDirectoryDeliveryControllerRemoveData,
  PrintableDirectoryDeliveryControllerRemoveParams,
  PrintableDirectoryDeliveryControllerUpdateData,
  PrintableDirectoryDeliveryControllerUpdateParams,
  UpdatePrintableDirectoryDeliveryDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class PrintableDirectoryDeliveries<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Requires edit access to the directory.
   *
   * @tags Printable Directory Deliveries
   * @name PrintableDirectoryDeliveryControllerList
   * @summary List scheduled PDF deliveries
   * @request GET:/printable-directories/{id}/deliveries
   * @secure
   */
  printableDirectoryDeliveryControllerList = (
    { id, ...query }: PrintableDirectoryDeliveryControllerListParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryControllerListData, any>({
      path: `/printable-directories/${id}/deliveries`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Requires edit access to the directory. The creator's email is taken from the token.
   *
   * @tags Printable Directory Deliveries
   * @name PrintableDirectoryDeliveryControllerCreate
   * @summary Create a scheduled PDF delivery
   * @request POST:/printable-directories/{id}/deliveries
   * @secure
   */
  printableDirectoryDeliveryControllerCreate = (
    { id, ...query }: PrintableDirectoryDeliveryControllerCreateParams,
    data: CreatePrintableDirectoryDeliveryDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryControllerCreateData, void>({
      path: `/printable-directories/${id}/deliveries`,
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
   * @tags Printable Directory Deliveries
   * @name PrintableDirectoryDeliveryControllerUpdate
   * @summary Update a scheduled PDF delivery
   * @request PATCH:/printable-directories/{id}/deliveries/{deliveryId}
   * @secure
   */
  printableDirectoryDeliveryControllerUpdate = (
    {
      id,
      deliveryId,
      ...query
    }: PrintableDirectoryDeliveryControllerUpdateParams,
    data: UpdatePrintableDirectoryDeliveryDto,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryControllerUpdateData, any>({
      path: `/printable-directories/${id}/deliveries/${deliveryId}`,
      method: "PATCH",
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
   * @tags Printable Directory Deliveries
   * @name PrintableDirectoryDeliveryControllerRemove
   * @summary Delete a scheduled PDF delivery
   * @request DELETE:/printable-directories/{id}/deliveries/{deliveryId}
   * @secure
   */
  printableDirectoryDeliveryControllerRemove = (
    {
      id,
      deliveryId,
      ...query
    }: PrintableDirectoryDeliveryControllerRemoveParams,
    params: RequestParams = {},
  ) =>
    this.request<PrintableDirectoryDeliveryControllerRemoveData, any>({
      path: `/printable-directories/${id}/deliveries/${deliveryId}`,
      method: "DELETE",
      query: query,
      secure: true,
      ...params,
    });
}
