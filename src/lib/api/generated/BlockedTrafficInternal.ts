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
  BlockedTrafficInternalControllerRecordData,
  RecordBlockedTrafficDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class BlockedTrafficInternal<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Adds per-hour deltas aggregated by a Norse instance. Additive: two pushes for the same bucket are summed.
   *
   * @tags Blocked Traffic (Internal)
   * @name BlockedTrafficInternalControllerRecord
   * @summary Add blocked-request counts for the tenant
   * @request POST:/internal/blocked-traffic
   * @secure
   */
  blockedTrafficInternalControllerRecord = (
    data: RecordBlockedTrafficDto,
    params: RequestParams = {},
  ) =>
    this.request<BlockedTrafficInternalControllerRecordData, any>({
      path: `/internal/blocked-traffic`,
      method: "POST",
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
}
