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
  SuggestionControllerGetTaxonomiesData,
  SuggestionControllerGetTaxonomiesParams,
  SuggestionControllerGetTaxonomyTermsByCodeData,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Suggestion<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Suggestion
   * @name SuggestionControllerGetTaxonomies
   * @request GET:/suggestion
   */
  suggestionControllerGetTaxonomies = (
    query: SuggestionControllerGetTaxonomiesParams = {},
    params: RequestParams = {},
  ) =>
    this.request<SuggestionControllerGetTaxonomiesData, any>({
      path: `/suggestion`,
      method: "GET",
      query: query,
      ...params,
    });
  /**
   * No description
   *
   * @tags Suggestion
   * @name SuggestionControllerGetTaxonomyTermsByCode
   * @request GET:/suggestion/term
   */
  suggestionControllerGetTaxonomyTermsByCode = (params: RequestParams = {}) =>
    this.request<SuggestionControllerGetTaxonomyTermsByCodeData, any>({
      path: `/suggestion/term`,
      method: "GET",
      ...params,
    });
}
