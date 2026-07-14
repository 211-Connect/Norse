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
  GeocodingControllerForwardGeocodeData,
  GeocodingControllerForwardGeocodeParams,
  GeocodingControllerReverseGeocodeData,
  GeocodingControllerReverseGeocodeParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Geocoding<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Converts a human-readable address into geographic coordinates (longitude, latitude). This endpoint acts as a proxy to Mapbox API and includes caching to improve performance.
   *
   * @tags Geocoding
   * @name GeocodingControllerForwardGeocode
   * @summary Forward geocoding - convert address to coordinates
   * @request GET:/geocoding/forward
   */
  geocodingControllerForwardGeocode = (
    query: GeocodingControllerForwardGeocodeParams,
    params: RequestParams = {},
  ) =>
    this.request<GeocodingControllerForwardGeocodeData, void>({
      path: `/geocoding/forward`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Converts geographic coordinates (longitude, latitude) into a human-readable address. This endpoint acts as a proxy to Mapbox API and includes caching to improve performance.
   *
   * @tags Geocoding
   * @name GeocodingControllerReverseGeocode
   * @summary Reverse geocoding - convert coordinates to address
   * @request GET:/geocoding/reverse
   */
  geocodingControllerReverseGeocode = (
    query: GeocodingControllerReverseGeocodeParams,
    params: RequestParams = {},
  ) =>
    this.request<GeocodingControllerReverseGeocodeData, void>({
      path: `/geocoding/reverse`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
