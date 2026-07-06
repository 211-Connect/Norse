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
  CreateFavoriteDto,
  FavoriteControllerCreateData,
  FavoriteControllerRemoveData,
  FavoriteControllerRemoveParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Favorite<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Favorite
   * @name FavoriteControllerCreate
   * @request POST:/favorite
   */
  favoriteControllerCreate = (
    data: CreateFavoriteDto,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteControllerCreateData, any>({
      path: `/favorite`,
      method: "POST",
      body: data,
      type: "application/json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Favorite
   * @name FavoriteControllerRemove
   * @request DELETE:/favorite/{favoriteId}/{favoriteListId}
   */
  favoriteControllerRemove = (
    { favoriteId, favoriteListId }: FavoriteControllerRemoveParams,
    params: RequestParams = {},
  ) =>
    this.request<FavoriteControllerRemoveData, any>({
      path: `/favorite/${favoriteId}/${favoriteListId}`,
      method: "DELETE",
      ...params,
    });
}
