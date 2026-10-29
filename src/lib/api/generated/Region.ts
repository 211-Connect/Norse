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
  RegionPublicControllerGetData,
  RegionPublicControllerGetParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Region<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description The id is what `GET /search` takes as `region` and returns in `resolved_location`, e.g. `county:53077`.
   *
   * @tags Region
   * @name RegionPublicControllerGet
   * @summary One Region (state, county, place or ZIP) with its boundary.
   * @request GET:/regions/{id}
   */
  regionPublicControllerGet = (
    { id, ...query }: RegionPublicControllerGetParams,
    params: RequestParams = {},
  ) =>
    this.request<RegionPublicControllerGetData, void>({
      path: `/regions/${id}`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
