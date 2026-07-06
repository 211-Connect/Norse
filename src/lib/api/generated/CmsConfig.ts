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
  CmsConfigControllerClearAllCachesData,
  CmsConfigControllerClearTenantCacheData,
  CmsConfigControllerClearTenantCacheParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class CmsConfig<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags CMS Config
   * @name CmsConfigControllerClearAllCaches
   * @request POST:/cms-config/cache/clear
   * @secure
   */
  cmsConfigControllerClearAllCaches = (params: RequestParams = {}) =>
    this.request<CmsConfigControllerClearAllCachesData, void>({
      path: `/cms-config/cache/clear`,
      method: "POST",
      secure: true,
      ...params,
    });
  /**
   * No description
   *
   * @tags CMS Config
   * @name CmsConfigControllerClearTenantCache
   * @request POST:/cms-config/cache/clear/{tenantId}
   * @secure
   */
  cmsConfigControllerClearTenantCache = (
    { tenantId }: CmsConfigControllerClearTenantCacheParams,
    params: RequestParams = {},
  ) =>
    this.request<CmsConfigControllerClearTenantCacheData, void>({
      path: `/cms-config/cache/clear/${tenantId}`,
      method: "POST",
      secure: true,
      ...params,
    });
}
