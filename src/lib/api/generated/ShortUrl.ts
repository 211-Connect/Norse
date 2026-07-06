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
  ShortUrlControllerGetOrCreateShortUrlData,
  ShortUrlControllerGetShortUrlByIdData,
  ShortUrlControllerGetShortUrlByIdParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class ShortUrl<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Short URL
   * @name ShortUrlControllerGetShortUrlById
   * @request GET:/short-url/{id}
   */
  shortUrlControllerGetShortUrlById = (
    { id }: ShortUrlControllerGetShortUrlByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ShortUrlControllerGetShortUrlByIdData, any>({
      path: `/short-url/${id}`,
      method: "GET",
      ...params,
    });
  /**
   * No description
   *
   * @tags Short URL
   * @name ShortUrlControllerGetOrCreateShortUrl
   * @request POST:/short-url
   */
  shortUrlControllerGetOrCreateShortUrl = (params: RequestParams = {}) =>
    this.request<ShortUrlControllerGetOrCreateShortUrlData, any>({
      path: `/short-url`,
      method: "POST",
      ...params,
    });
}
