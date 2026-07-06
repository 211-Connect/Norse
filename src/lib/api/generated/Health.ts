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

import { HealthControllerGetStatusData } from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Health<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Health
   * @name HealthControllerGetStatus
   * @request GET:/health
   */
  healthControllerGetStatus = (params: RequestParams = {}) =>
    this.request<HealthControllerGetStatusData, any>({
      path: `/health`,
      method: "GET",
      format: "json",
      ...params,
    });
}
