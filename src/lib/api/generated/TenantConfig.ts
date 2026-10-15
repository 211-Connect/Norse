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
  TenantConfigControllerGetAllTenantConfigData,
  TenantConfigControllerGetAllTenantConfigParams,
  TenantConfigControllerGetSuggestionsData,
  TenantConfigControllerGetSuggestionsParams,
  TenantConfigControllerGetTopicsData,
  TenantConfigControllerGetTopicsParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class TenantConfig<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Tenant Config
   * @name TenantConfigControllerGetTopics
   * @summary Get tenant topics configuration
   * @request GET:/tenant-config/{tenantId}/topics
   */
  tenantConfigControllerGetTopics = (
    { tenantId }: TenantConfigControllerGetTopicsParams,
    params: RequestParams = {},
  ) =>
    this.request<TenantConfigControllerGetTopicsData, void>({
      path: `/tenant-config/${tenantId}/topics`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Tenant Config
   * @name TenantConfigControllerGetSuggestions
   * @summary Get tenant suggestions configuration
   * @request GET:/tenant-config/{tenantId}/suggestions
   */
  tenantConfigControllerGetSuggestions = (
    { tenantId }: TenantConfigControllerGetSuggestionsParams,
    params: RequestParams = {},
  ) =>
    this.request<TenantConfigControllerGetSuggestionsData, void>({
      path: `/tenant-config/${tenantId}/suggestions`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Tenant Config
   * @name TenantConfigControllerGetAllTenantConfig
   * @summary Get full tenant configuration aggregate
   * @request GET:/tenant-config/{tenantId}
   */
  tenantConfigControllerGetAllTenantConfig = (
    { tenantId }: TenantConfigControllerGetAllTenantConfigParams,
    params: RequestParams = {},
  ) =>
    this.request<TenantConfigControllerGetAllTenantConfigData, void>({
      path: `/tenant-config/${tenantId}`,
      method: "GET",
      format: "json",
      ...params,
    });
}
