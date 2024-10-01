import path from 'path';
import fs from 'fs/promises';
import { GetServerSidePropsContext } from 'next';
import { Flags } from '../context/flags-context';
import { stringToBooleanOrUndefined } from './utils';
import _ from 'lodash';
import { shake } from 'radash';

let config = undefined;
export async function serverSideAppConfig() {
  if (config != null) return { appConfig: config };

  let rawData;
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

let flags: Flags = undefined;
let defaultFlags: Flags = {
  showResourceCategories: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_RESOURCE_CATEGORIES_FLAG,
  ),
  showResourceLastAssuredDate: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_RESOURCE_LAST_ASSURED_DATE_FLAG,
  ),
  showHomePageTour: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_HOME_PAGE_TOUR_FLAG,
  ),
  showResourceAttribution: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_RESOURCE_ATTRIBUTION_FLAG,
  ),
  showSearchAndResourceServiceName: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_SEARCH_AND_RESOURCE_SERVICE_NAME_FLAG,
  ),
  showSuggestionListTaxonomyBadge: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_SUGGESTION_LIST_TAXONOMY_BADGE_FLAG,
  ),
  requireUserLocation: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_REQUIRE_USER_LOCATION_FLAG,
  ),
  showUseMyLocationButtonOnDesktop: stringToBooleanOrUndefined(
    process.env.NEXT_PUBLIC_SHOW_USE_MY_LOCATION_BUTTON_ON_DESKTOP_FLAG,
  ),
};
export async function serverSideFlags() {
  if (flags != null) return { flags };

  let rawData;
  try {
    await fs.stat(path.resolve('./.norse/flags.json'));
    rawData = await fs.readFile(path.resolve('./.norse/flags.json'));
    flags = _.omitBy(
      _.merge(
        {},
        JSON.parse(rawData.toString()),
        defaultFlags,
        (objValue, srcValue) => {
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

const isProduction = process.env.NODE_ENV === 'production';
export function cacheControl(ctx: GetServerSidePropsContext) {
  if (isProduction) {
    ctx.res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=60, stale-while-revalidate=60',
    );
  }
}
