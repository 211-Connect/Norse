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
}
