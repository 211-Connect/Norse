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
  EnableTaxonomyScorecardDto,
  TaxonomyScorecardControllerEnableTaxonomyScorecardVersionData,
  TaxonomyScorecardControllerEnableTaxonomyScorecardVersionParams,
  TaxonomyScorecardControllerGetTaxonomyConfigurationData,
  TaxonomyScorecardControllerGetTaxonomyConfigurationParams,
  TaxonomyScorecardControllerSearchTaxonomiesData,
  TaxonomyScorecardControllerSearchTaxonomiesParams,
  TaxonomyScorecardControllerUpdateTaxonomyConfigurationData,
  TaxonomyScorecardControllerUpdateTaxonomyConfigurationParams,
  UpdateTaxonomyScorecardDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class TaxonomyScorecard<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Taxonomy Scorecard
   * @name TaxonomyScorecardControllerSearchTaxonomies
   * @summary Search HSIS taxonomies for scorecard customization
   * @request GET:/taxonomy-scorecard/taxonomies
   * @secure
   */
  taxonomyScorecardControllerSearchTaxonomies = (
    query: TaxonomyScorecardControllerSearchTaxonomiesParams,
    params: RequestParams = {},
  ) =>
    this.request<TaxonomyScorecardControllerSearchTaxonomiesData, any>({
      path: `/taxonomy-scorecard/taxonomies`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Taxonomy Scorecard
   * @name TaxonomyScorecardControllerGetTaxonomyConfiguration
   * @summary Get effective taxonomy scorecard configuration for tenant
   * @request GET:/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}
   * @secure
   */
  taxonomyScorecardControllerGetTaxonomyConfiguration = (
    {
      tenantId,
      hsisCode,
    }: TaxonomyScorecardControllerGetTaxonomyConfigurationParams,
    params: RequestParams = {},
  ) =>
    this.request<TaxonomyScorecardControllerGetTaxonomyConfigurationData, any>({
      path: `/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Taxonomy Scorecard
   * @name TaxonomyScorecardControllerUpdateTaxonomyConfiguration
   * @summary Update tenant taxonomy scorecard configuration
   * @request PUT:/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}
   * @secure
   */
  taxonomyScorecardControllerUpdateTaxonomyConfiguration = (
    {
      tenantId,
      hsisCode,
      ...query
    }: TaxonomyScorecardControllerUpdateTaxonomyConfigurationParams,
    data: UpdateTaxonomyScorecardDto,
    params: RequestParams = {},
  ) =>
    this.request<
      TaxonomyScorecardControllerUpdateTaxonomyConfigurationData,
      any
    >({
      path: `/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}`,
      method: "PUT",
      query: query,
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Taxonomy Scorecard
   * @name TaxonomyScorecardControllerEnableTaxonomyScorecardVersion
   * @summary Enable tenant taxonomy scorecard version
   * @request POST:/taxonomy-scorecard/tenants/{tenantId}/taxonomies/{hsisCode}/enable
   * @secure
   */
  taxonomyScorecardControllerEnableTaxonomyScorecardVersion = (
    {
      tenantId,
      hsisCode,
    }: TaxonomyScorecardControllerEnableTaxonomyScorecardVersionParams,
    data: EnableTaxonomyScorecardDto,
    params: RequestParams = {},
  ) =>
    this.request<
      TaxonomyScorecardControllerEnableTaxonomyScorecardVersionData,
      any
    >({
      path: `/taxonomy-scorecard/tenants/${tenantId}/taxonomies/${hsisCode}/enable`,
      method: "POST",
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
}
