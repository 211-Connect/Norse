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
  CreateShortUrlDto,
  ShortUrlControllerGetOrCreateShortUrlData,
  ShortUrlControllerGetShortUrlByIdData,
  ShortUrlControllerGetShortUrlByIdParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class ShortUrl<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * @description Looks up the original URL for a previously issued short ID.
   *
   * @tags Short URL
   * @name ShortUrlControllerGetShortUrlById
   * @summary Resolve a short URL
   * @request GET:/short-url/{id}
   */
  shortUrlControllerGetShortUrlById = (
    { id }: ShortUrlControllerGetShortUrlByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ShortUrlControllerGetShortUrlByIdData, void>({
      path: `/short-url/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Returns the existing short URL for the given URL, or creates a new one if none exists yet.
   *
   * @tags Short URL
   * @name ShortUrlControllerGetOrCreateShortUrl
   * @summary Get or create a short URL
   * @request POST:/short-url
   */
  shortUrlControllerGetOrCreateShortUrl = (
    data: CreateShortUrlDto,
    params: RequestParams = {},
  ) =>
    this.request<ShortUrlControllerGetOrCreateShortUrlData, void>({
      path: `/short-url`,
      method: "POST",
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
}
