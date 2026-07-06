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
  ResourceBatchDto,
  ResourceControllerGetResourceByIdData,
  ResourceControllerGetResourceByIdParams,
  ResourceControllerGetResourceByOriginalIdData,
  ResourceControllerGetResourceByOriginalIdParams,
  ResourceControllerGetResourceTitlesByIdsData,
  ResourceControllerGetResourcesBatchData,
  ResourceTitlesDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Resource<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Resource
   * @name ResourceControllerGetResourceById
   * @request GET:/resource/{id}
   */
  resourceControllerGetResourceById = (
    { id }: ResourceControllerGetResourceByIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ResourceControllerGetResourceByIdData, any>({
      path: `/resource/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Resource
   * @name ResourceControllerGetResourceByOriginalId
   * @request GET:/resource/original/{id}
   */
  resourceControllerGetResourceByOriginalId = (
    { id }: ResourceControllerGetResourceByOriginalIdParams,
    params: RequestParams = {},
  ) =>
    this.request<ResourceControllerGetResourceByOriginalIdData, any>({
      path: `/resource/original/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * @description Returns display titles for the provided list of resource UUIDs.
   *
   * @tags Resource
   * @name ResourceControllerGetResourceTitlesByIds
   * @summary Get resource titles by IDs
   * @request POST:/resource/titles
   */
  resourceControllerGetResourceTitlesByIds = (
    data: ResourceTitlesDto,
    params: RequestParams = {},
  ) =>
    this.request<ResourceControllerGetResourceTitlesByIdsData, void>({
      path: `/resource/titles`,
      method: "POST",
      body: data,
      type: "application/json",
      ...params,
    });
  /**
   * @description Fetches multiple resources by their UUIDs. Returns a structured response with successful resources and errors for failed IDs. Supports partial success.
   *
   * @tags Resource
   * @name ResourceControllerGetResourcesBatch
   * @summary Batch fetch resources by IDs
   * @request POST:/resource/batch
   */
  resourceControllerGetResourcesBatch = (
    data: ResourceBatchDto,
    params: RequestParams = {},
  ) =>
    this.request<ResourceControllerGetResourcesBatchData, void>({
      path: `/resource/batch`,
      method: "POST",
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
}
