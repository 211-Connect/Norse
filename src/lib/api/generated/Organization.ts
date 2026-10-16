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
  OrganizationControllerGetOrganizationByIdData,
  OrganizationControllerGetOrganizationByIdParams,
  OrganizationControllerGetOrganizationByServiceAtLocationData,
  OrganizationControllerGetOrganizationByServiceAtLocationParams,
  OrganizationControllerSearchData,
  OrganizationControllerSearchParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Organization<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Organization
   * @name OrganizationControllerSearch
   * @request GET:/organization
   */
  organizationControllerSearch = (
    query: OrganizationControllerSearchParams,
    params: RequestParams = {},
  ) =>
    this.request<OrganizationControllerSearchData, any>({
      path: `/organization`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Resolves the one organization in the x-tenant-id tenant whose services carry this service@location id. Tenant-scoped only: no cross-tenant or legacy-id fallback. The same SAL id can belong to different organization documents in different tenants, so the tenant is required.
   *
   * @tags Organization
   * @name OrganizationControllerGetOrganizationByServiceAtLocation
   * @summary Organization that offers a service-at-location, in this tenant
   * @request GET:/organization/service-at-location/{salId}
   */
  organizationControllerGetOrganizationByServiceAtLocation = (
    {
      salId,
      ...query
    }: OrganizationControllerGetOrganizationByServiceAtLocationParams,
    params: RequestParams = {},
  ) =>
    this.request<
      OrganizationControllerGetOrganizationByServiceAtLocationData,
      void
    >({
      path: `/organization/service-at-location/${salId}`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Organization
   * @name OrganizationControllerGetOrganizationById
   * @request GET:/organization/{id}
   */
  organizationControllerGetOrganizationById = (
    { id, ...query }: OrganizationControllerGetOrganizationByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<OrganizationControllerGetOrganizationByIdData, void>({
      path: `/organization/${id}`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
