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
  CrawlerTrafficInternalControllerRecordData,
  RecordCrawlerTrafficDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class CrawlerTrafficInternal<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Adds per-hour deltas aggregated by a Norse instance. Additive: two pushes for the same bucket are summed.
   *
   * @tags Crawler Traffic (Internal)
   * @name CrawlerTrafficInternalControllerRecord
   * @summary Add per-crawler request counts for the tenant
   * @request POST:/internal/crawler-traffic
   * @secure
   */
  crawlerTrafficInternalControllerRecord = (
    data: RecordCrawlerTrafficDto,
    params: RequestParams = {},
  ) =>
    this.request<CrawlerTrafficInternalControllerRecordData, any>({
      path: `/internal/crawler-traffic`,
      method: "POST",
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
}
