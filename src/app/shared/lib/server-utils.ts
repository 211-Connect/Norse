import path from 'path';
import fs from 'fs/promises';
import { Flags } from '../context/flags-context';
import { stringToBooleanOrUndefined } from './utils';
import _ from 'lodash';

let config: any = undefined;
export async function serverSideAppConfig() {
  if (config != null) return { appConfig: config };

  let rawData: any;
  try {
    await fs.stat(path.resolve('./.norse/config.json'));
    rawData = await fs.readFile(path.resolve('./.norse/config.json'));
  } catch (_err) {
    // file doesn't exist. Don't do anything
  }

  if (!rawData) {
    try {
      rawData = await fs.readFile(path.resolve('./app.defaults.json'));
    } catch (err) {
      console.error('failed to read app.defaults.json', err);
    }
  }

  try {
    config = JSON.parse(rawData.toString());
  } catch (err) {
    console.error('Unable to parse app.config', err);
    config = {};
  }

  return {
    appConfig: config,
  };
}

let flags: Flags | undefined = undefined;
let defaultFlags: Flags = {
  showResourceCategories:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_RESOURCE_CATEGORIES_FLAG,
    ) ?? false,
  showResourceLastAssuredDate:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_RESOURCE_LAST_ASSURED_DATE_FLAG,
    ) ?? false,
  showHomePageTour:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_HOME_PAGE_TOUR_FLAG,
    ) ?? false,
  showResourceAttribution:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_RESOURCE_ATTRIBUTION_FLAG,
    ) ?? false,
  showSearchAndResourceServiceName:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_SEARCH_AND_RESOURCE_SERVICE_NAME_FLAG,
    ) ?? false,
  showSuggestionListTaxonomyBadge:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_SUGGESTION_LIST_TAXONOMY_BADGE_FLAG,
    ) ?? false,
  requireUserLocation:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_REQUIRE_USER_LOCATION_FLAG,
    ) ?? false,
  showUseMyLocationButtonOnDesktop:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_USE_MY_LOCATION_BUTTON_ON_DESKTOP_FLAG,
    ) ?? false,
  showPrintButton:
    stringToBooleanOrUndefined(
      process.env.NEXT_PUBLIC_SHOW_PRINT_BUTTON_FLAG,
    ) ?? false,
};
export async function serverSideFlags() {
  if (flags != null) return { flags };

  let rawData: any;
  try {
    await fs.stat(path.resolve('./.norse/flags.json'));
    rawData = await fs.readFile(path.resolve('./.norse/flags.json'));
    flags = _.omitBy(
      _.merge(
        {},
        defaultFlags,
        JSON.parse(rawData.toString()),
        (objValue: any, srcValue: any) => {
          return objValue !== undefined ? objValue : srcValue;
        },
      ),
      (value) => value == null,
    ) as Flags;
  } catch (_err) {
    // file doesn't exist OR issue parsing JSON. Save a default flags object
    flags = defaultFlags;
  }

  return {
    flags,
  };
}
