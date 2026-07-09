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
  CreateFavoriteListDto,
  FavoriteListControllerCreateData,
  FavoriteListControllerFindAllData,
  FavoriteListControllerFindAllParams,
  FavoriteListControllerFindOneData,
  FavoriteListControllerFindOneParams,
  FavoriteListControllerPurgeData,
  FavoriteListControllerPurgeParams,
  FavoriteListControllerRemoveData,
  FavoriteListControllerRemoveParams,
  FavoriteListControllerSearchData,
  FavoriteListControllerSearchParams,
  FavoriteListControllerSyncLocalListData,
  FavoriteListControllerUpdateData,
  FavoriteListControllerUpdateParams,
  SyncFavoriteListDto,
  UpdateFavoriteListDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class FavoriteList<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerCreate
   * @request POST:/favorite-list
   */
  favoriteListControllerCreate = (
    data: CreateFavoriteListDto,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerCreateData, any>({
      path: `/favorite-list`,
      method: "POST",
      body: data,
      type: "application/json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerFindAll
   * @request GET:/favorite-list
   */
  favoriteListControllerFindAll = (
    query: FavoriteListControllerFindAllParams = {},
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerFindAllData, any>({
      path: `/favorite-list`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerSyncLocalList
   * @request POST:/favorite-list/sync
   */
  favoriteListControllerSyncLocalList = (
    data: SyncFavoriteListDto,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerSyncLocalListData, any>({
      path: `/favorite-list/sync`,
      method: "POST",
      body: data,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerSearch
   * @request GET:/favorite-list/search
   */
  favoriteListControllerSearch = (
    query: FavoriteListControllerSearchParams = {},
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerSearchData, any>({
      path: `/favorite-list/search`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerFindOne
   * @request GET:/favorite-list/{id}
   */
  favoriteListControllerFindOne = (
    { id }: FavoriteListControllerFindOneParams,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerFindOneData, any>({
      path: `/favorite-list/${id}`,
      method: "GET",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerUpdate
   * @request PUT:/favorite-list/{id}
   */
  favoriteListControllerUpdate = (
    { id }: FavoriteListControllerUpdateParams,
    data: UpdateFavoriteListDto,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerUpdateData, any>({
      path: `/favorite-list/${id}`,
      method: "PUT",
      body: data,
      type: "application/json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerRemove
   * @request DELETE:/favorite-list/{id}
   */
  favoriteListControllerRemove = (
    { id }: FavoriteListControllerRemoveParams,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerRemoveData, any>({
      path: `/favorite-list/${id}`,
      method: "DELETE",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite List
   * @name FavoriteListControllerPurge
   * @request DELETE:/favorite-list/{id}/favorites
   */
  favoriteListControllerPurge = (
    { id }: FavoriteListControllerPurgeParams,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteListControllerPurgeData, any>({
      path: `/favorite-list/${id}/favorites`,
      method: "DELETE",
      ...params,
    });
}
