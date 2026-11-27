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
  RegionPublicControllerListByStateData,
  RegionPublicControllerListByStateParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Region<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description For choosing which Regions get SEO landing pages. Sorted by name. Each place carries `county_id`, the county containing its centroid. Global catalog: not filtered by tenant coverage.
   *
   * @tags Region
   * @name RegionPublicControllerListByState
   * @summary A state's counties and places, without boundaries.
   * @request GET:/regions
   */
  regionPublicControllerListByState = (
    query: RegionPublicControllerListByStateParams,
    params: RequestParams = {},
  ) =>
    this.request<RegionPublicControllerListByStateData, void>({
      path: `/regions`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
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
