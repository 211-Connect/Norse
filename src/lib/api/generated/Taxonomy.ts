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
  TaxonomyControllerGetTaxonomiesData,
  TaxonomyControllerGetTaxonomiesParams,
  TaxonomyControllerGetTaxonomyTermsByCodeData,
  TaxonomyControllerGetTaxonomyTermsByCodeParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Taxonomy<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Taxonomy
   * @name TaxonomyControllerGetTaxonomies
   * @request GET:/taxonomy
   */
  taxonomyControllerGetTaxonomies = (
    query: TaxonomyControllerGetTaxonomiesParams = {},
    params: RequestParams = {},
  ) =>
    this.request<TaxonomyControllerGetTaxonomiesData, any>({
      path: `/taxonomy`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * @description Retrieve specific taxonomy terms by their exact codes. Accepts single code or array of codes.
   *
   * @tags Taxonomy
   * @name TaxonomyControllerGetTaxonomyTermsByCode
   * @summary Get taxonomy terms by codes
   * @request GET:/taxonomy/term
   */
  taxonomyControllerGetTaxonomyTermsByCode = (
    query: TaxonomyControllerGetTaxonomyTermsByCodeParams = {},
    params: RequestParams = {},
  ) =>
    this.request<TaxonomyControllerGetTaxonomyTermsByCodeData, any>({
      path: `/taxonomy/term`,
      method: "GET",
      query: query,
      ...params,
    });
}
