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
  SuggestionControllerGetSuggestionsData,
  SuggestionControllerGetSuggestionsParams,
  SuggestionControllerGetTaxonomyTermsByCodeData,
  SuggestionControllerGetTaxonomyTermsByCodeParams,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Suggestion<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Suggestion
   * @name SuggestionControllerGetSuggestions
   * @request GET:/suggestion
   */
  suggestionControllerGetSuggestions = (
    query: SuggestionControllerGetSuggestionsParams = {},
    params: RequestParams = {},
  ) =>
    this.request<SuggestionControllerGetSuggestionsData, any>({
      path: `/suggestion`,
      method: "GET",
      query: query,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Suggestion
   * @name SuggestionControllerGetTaxonomyTermsByCode
   * @request GET:/suggestion/term
   */
  suggestionControllerGetTaxonomyTermsByCode = (
    query: SuggestionControllerGetTaxonomyTermsByCodeParams = {},
    params: RequestParams = {},
  ) =>
    this.request<SuggestionControllerGetTaxonomyTermsByCodeData, any>({
      path: `/suggestion/term`,
      method: "GET",
      query: query,
      ...params,
    });
}
