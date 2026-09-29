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
  ServiceControllerGetServiceByIdData,
  ServiceControllerGetServiceByIdParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Service<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Service
   * @name ServiceControllerGetServiceById
   * @request GET:/service/{id}
   */
  serviceControllerGetServiceById = (
    { id, ...query }: ServiceControllerGetServiceByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ServiceControllerGetServiceByIdData, void>({
      path: `/service/${id}`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
