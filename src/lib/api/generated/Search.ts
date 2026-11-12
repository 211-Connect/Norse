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
  SearchControllerGetPinsData,
  SearchControllerGetPinsParams,
  SearchControllerGetResourcesData,
  SearchControllerGetResourcesParams,
  SearchControllerGetResourcesPostData,
  SearchControllerGetResourcesPostParams,
  SearchControllerGetResourcesPostPayload,
  SearchControllerPredictNeedsClassificationData,
  SearchControllerPredictNeedsClassificationParams,
  SearchControllerReRankNeedsClassificationData,
  SearchControllerReRankNeedsClassificationParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Search<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerGetResources
   * @request GET:/search
   */
  searchControllerGetResources = (
    query: SearchControllerGetResourcesParams = {},
    params: RequestParams = {},
  ) =>
    this.request<SearchControllerGetResourcesData, any>({
      path: `/search`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerGetResourcesPost
   * @request POST:/search
   */
  searchControllerGetResourcesPost = (
    query: SearchControllerGetResourcesPostParams = {},
    data: SearchControllerGetResourcesPostPayload,
    params: RequestParams = {},
  ) =>
    this.request<SearchControllerGetResourcesPostData, any>({
      path: `/search`,
      method: "POST",
      query: query,
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * @description The locations of a search independent of list pagination, up to 10,000. Takes the same params as GET /search; `page` and `limit` are ignored. Matches without coordinates are left out, including from `total`.
   *
   * @tags Search
   * @name SearchControllerGetPins
   * @summary Map pins for a search
   * @request GET:/search/pins
   */
  searchControllerGetPins = (
    query: SearchControllerGetPinsParams = {},
    params: RequestParams = {},
  ) =>
    this.request<SearchControllerGetPinsData, any>({
      path: `/search/pins`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerPredictNeedsClassification
   * @request GET:/search/predict
   */
  searchControllerPredictNeedsClassification = (
    query: SearchControllerPredictNeedsClassificationParams,
    params: RequestParams = {},
  ) =>
    this.request<SearchControllerPredictNeedsClassificationData, any>({
      path: `/search/predict`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Search
   * @name SearchControllerReRankNeedsClassification
   * @request GET:/search/re-rank
   */
  searchControllerReRankNeedsClassification = (
    query: SearchControllerReRankNeedsClassificationParams,
    params: RequestParams = {},
  ) =>
    this.request<SearchControllerReRankNeedsClassificationData, any>({
      path: `/search/re-rank`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
}
