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
  OrchestrationConfigControllerGetAllTenantConfigData,
  OrchestrationConfigControllerGetAllTenantConfigParams,
  OrchestrationConfigControllerGetCustomAttributesData,
  OrchestrationConfigControllerGetCustomAttributesParams,
  OrchestrationConfigControllerGetTenantFacetsData,
  OrchestrationConfigControllerGetTenantFacetsParams,
  OrchestrationConfigControllerGetTenantLocalesData,
  OrchestrationConfigControllerGetTenantLocalesParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class OrchestrationConfig<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Orchestration Config
   * @name OrchestrationConfigControllerGetCustomAttributes
   * @request GET:/orchestration-config/custom-attributes
   * @secure
   */
  orchestrationConfigControllerGetCustomAttributes = (
    query: OrchestrationConfigControllerGetCustomAttributesParams = {},
    params: RequestParams = {},
  ) =>
    this.request<OrchestrationConfigControllerGetCustomAttributesData, void>({
      path: `/orchestration-config/custom-attributes`,
      method: "GET",
      query: query,
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags Orchestration Config
   * @name OrchestrationConfigControllerGetTenantLocales
   * @request GET:/orchestration-config/locales/{tenantId}
   * @secure
   */
  orchestrationConfigControllerGetTenantLocales = (
    { tenantId }: OrchestrationConfigControllerGetTenantLocalesParams,
    params: RequestParams = {},
  ) =>
    this.request<OrchestrationConfigControllerGetTenantLocalesData, void>({
      path: `/orchestration-config/locales/${tenantId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Orchestration Config
   * @name OrchestrationConfigControllerGetTenantFacets
   * @request GET:/orchestration-config/facets/{tenantId}
   * @secure
   */
  orchestrationConfigControllerGetTenantFacets = (
    { tenantId }: OrchestrationConfigControllerGetTenantFacetsParams,
    params: RequestParams = {},
  ) =>
    this.request<OrchestrationConfigControllerGetTenantFacetsData, void>({
      path: `/orchestration-config/facets/${tenantId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Orchestration Config
   * @name OrchestrationConfigControllerGetAllTenantConfig
   * @request GET:/orchestration-config/{tenantId}
   * @secure
   */
  orchestrationConfigControllerGetAllTenantConfig = (
    { tenantId }: OrchestrationConfigControllerGetAllTenantConfigParams,
    params: RequestParams = {},
  ) =>
    this.request<OrchestrationConfigControllerGetAllTenantConfigData, void>({
      path: `/orchestration-config/${tenantId}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
}
