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
  AnalyticsControllerGetExportSearchDataData,
  AnalyticsControllerGetExportSearchDataParams,
  AnalyticsControllerGetInfoData,
  AnalyticsControllerGetLanguageSwitchesData,
  AnalyticsControllerGetLanguageSwitchesParams,
  AnalyticsControllerGetMetricsData,
  AnalyticsControllerGetMetricsParams,
  AnalyticsControllerGetPageviewsData,
  AnalyticsControllerGetPageviewsParams,
  AnalyticsControllerGetResourceByEntryData,
  AnalyticsControllerGetResourceByEntryParams,
  AnalyticsControllerGetResourceMetricsData,
  AnalyticsControllerGetResourceMetricsParams,
  AnalyticsControllerGetSearchesData,
  AnalyticsControllerGetSearchesParams,
  AnalyticsControllerGetSessionsData,
  AnalyticsControllerGetSessionsParams,
  AnalyticsControllerGetStatsData,
  AnalyticsControllerGetStatsParams,
  AnalyticsControllerGetZeroResultQueriesData,
  AnalyticsControllerGetZeroResultQueriesParams,
  AnalyticsControllerSendBatchData,
  AnalyticsControllerSendEventData,
  SendBatchDto,
  SendEventDto,
} from "./data-contracts";
import { HttpClient, RequestParams } from "./http-client";

export class Analytics<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetInfo
   * @summary Get analytics configuration for the authenticated tenant
   * @request GET:/analytics/info
   * @secure
   */
  analyticsControllerGetInfo = (params: RequestParams = {}) =>
    this.request<AnalyticsControllerGetInfoData, any>({
      path: `/analytics/info`,
      method: "GET",
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetStats
   * @summary Get analytics basic stats
   * @request GET:/analytics/stats
   * @secure
   */
  analyticsControllerGetStats = (
    query: AnalyticsControllerGetStatsParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetStatsData, any>({
      path: `/analytics/stats`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetPageviews
   * @summary Get pageview metrics per day
   * @request GET:/analytics/pageviews
   * @secure
   */
  analyticsControllerGetPageviews = (
    query: AnalyticsControllerGetPageviewsParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetPageviewsData, any>({
      path: `/analytics/pageviews`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetMetrics
   * @summary Get aggregated analytics metrics
   * @request GET:/analytics/metrics
   * @secure
   */
  analyticsControllerGetMetrics = (
    query: AnalyticsControllerGetMetricsParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetMetricsData, any>({
      path: `/analytics/metrics`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetResourceMetrics
   * @summary Get pageview metrics per resource
   * @request GET:/analytics/resource-metrics
   * @secure
   */
  analyticsControllerGetResourceMetrics = (
    query: AnalyticsControllerGetResourceMetricsParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetResourceMetricsData, any>({
      path: `/analytics/resource-metrics`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetSearches
   * @summary Get number of all search queries grouped by query type
   * @request GET:/analytics/searches
   * @secure
   */
  analyticsControllerGetSearches = (
    query: AnalyticsControllerGetSearchesParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetSearchesData, any>({
      path: `/analytics/searches`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetZeroResultQueries
   * @summary Get search queries that returned zero results
   * @request GET:/analytics/zero-result-queries
   * @secure
   */
  analyticsControllerGetZeroResultQueries = (
    query: AnalyticsControllerGetZeroResultQueriesParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetZeroResultQueriesData, any>({
      path: `/analytics/zero-result-queries`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetLanguageSwitches
   * @summary Get metrics for language switch destination pages
   * @request GET:/analytics/language-switches
   * @secure
   */
  analyticsControllerGetLanguageSwitches = (
    query: AnalyticsControllerGetLanguageSwitchesParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetLanguageSwitchesData, any>({
      path: `/analytics/language-switches`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetResourceByEntry
   * @summary Get resource view metrics grouped by entry page
   * @request GET:/analytics/resource-by-entry
   * @secure
   */
  analyticsControllerGetResourceByEntry = (
    query: AnalyticsControllerGetResourceByEntryParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetResourceByEntryData, any>({
      path: `/analytics/resource-by-entry`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerGetSessions
   * @summary Get visitor sessions
   * @request GET:/analytics/sessions
   * @secure
   */
  analyticsControllerGetSessions = (
    query: AnalyticsControllerGetSessionsParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetSessionsData, any>({
      path: `/analytics/sessions`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * @description Returns search events with timestamps, coordinates, and ZIP codes.
   *
   * @tags Analytics
   * @name AnalyticsControllerGetExportSearchData
   * @summary Get detailed search event data for CSV export
   * @request GET:/analytics/export-search-data
   * @secure
   */
  analyticsControllerGetExportSearchData = (
    query: AnalyticsControllerGetExportSearchDataParams,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerGetExportSearchDataData, any>({
      path: `/analytics/export-search-data`,
      method: "GET",
      query: query,
      secure: true,
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerSendEvent
   * @summary Send a custom event to Umami
   * @request POST:/analytics/events
   * @secure
   */
  analyticsControllerSendEvent = (
    data: SendEventDto,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerSendEventData, any>({
      path: `/analytics/events`,
      method: "POST",
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
  /**
   * No description
   *
   * @tags Analytics
   * @name AnalyticsControllerSendBatch
   * @summary Send multiple custom events to Umami in a single request
   * @request POST:/analytics/events/batch
   * @secure
   */
  analyticsControllerSendBatch = (
    data: SendBatchDto,
    params: RequestParams = {},
  ) =>
    this.request<AnalyticsControllerSendBatchData, any>({
      path: `/analytics/events/batch`,
      method: "POST",
      body: data,
      secure: true,
      type: "application/json",
      format: "json",
      ...params,
    });
}
